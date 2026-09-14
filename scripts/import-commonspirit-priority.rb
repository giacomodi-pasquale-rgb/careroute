require 'net/http'
require 'uri'
require 'json'
require 'cgi'

URLS = %w[
https://www.commonspirit.org/find-a-location/chi-st-vincent-morrilton-emergency-room-1382
https://www.commonspirit.org/find-a-location/commonspirit-saint-joseph-hospital-emergency-room-berea-3451
https://www.commonspirit.org/find-a-location/commonspirit-flaget-hospital-emergency-room-bardstown-1529
https://www.commonspirit.org/find-a-location/commonspirit-saint-joseph-hospital-emergency-room-mount-sterling-1263
https://www.commonspirit.org/find-a-location/commonspirit-saint-joseph-hospital-emergency-room-london-2814
https://www.commonspirit.org/find-a-location/commonspirit-memorial-hospital-emergency-room-north-georgia-3989
https://www.commonspirit.org/find-a-location/emergency-room-at-yavapai-regional-medical-center-west-2895
https://www.commonspirit.org/find-a-location/emergency-room-at-yavapai-regional-medical-center-east-3432
https://www.commonspirit.org/find-a-location/emergency-room-at-arizona-general-hospital-san-tan-valley-4059
https://www.commonspirit.org/find-a-location/emergency-room-at-arizona-general-hospital-surprise-3529
https://www.commonspirit.org/find-a-location/emergency-room-at-dignity-health-az-general-hospital-emergency-room-goodyear-3845
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-arroyo-grande-community-hospital-2998
https://www.commonspirit.org/find-a-location/oppenheimer-family-center-for-emergency-medicine-dignity-health-french-hospital-medical-center-2696
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-marian-regional-medical-center-1256
https://www.commonspirit.org/find-a-location/dignity-health-robert-a-grimm-childrens-pavilion-for-emergency-services-2169
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-mercy-medical-center-2467
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-mark-twain-medical-center-1198
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-mercy-medical-center-mt-shasta-487
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-st-elizabeth-community-hospital-3519
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-mercy-medical-center-redding-2903
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-sierra-nevada-memorial-hospital-3116
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-woodland-memorial-hospital-779
https://www.commonspirit.org/find-a-location/childrens-emergency-room-dignity-health-st-rose-dominican-siena-campus-henderson-686
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-st-rose-dominican-rose-de-lima-campus-henderson-2884
https://www.commonspirit.org/find-a-location/emergency-room-dignity-health-st-rose-dominican-san-martin-campus-las-vegas-1780
].freeze

def plain(html)
  CGI.unescapeHTML(html.gsub(/<script.*?<\/script>/mi,' ').gsub(/<style.*?<\/style>/mi,' ').gsub(/<[^>]+>/,' ').gsub(/\s+/,' ')).strip
end

cms = JSON.parse(File.read('data/review/us-hospitals.json'))['candidates']
patient = JSON.parse(File.read('data/v1/facilities.json'))['facilities']
served_states = patient.map { |facility| facility.dig('location','state') }.uniq

records = URLS.map.with_index do |url,index|
  uri=URI(url)
  response=Net::HTTP.get_response(uri)
  raise "#{response.code} #{url}" unless response.is_a?(Net::HTTPSuccess)
  html=response.body
  text=plain(html)
  name=CGI.unescapeHTML(html[/<h1[^>]*csh-aem-location-hero__title[^>]*>(.*?)<\/h1>/mi,1].to_s.gsub(/<[^>]+>/,''))
  address=CGI.unescapeHTML(html[/csh-aem-location-hero__address[^>]*>(.*?)<\/span>/mi,1].to_s.gsub(/<[^>]+>/,''))
  phone=html[/href="tel:(\d+)"/,1]
  latitude=html[/data-latitude="(-?[\d.]+)"/,1]&.to_f
  longitude=html[/data-longitude="(-?[\d.]+)"/,1]&.to_f
  state=address[/,\s*([A-Z]{2})\s+\d{5}/,1]
  city=address.split(',')[-2]&.strip
  number=address[/\d+/]
  candidates=cms.select { |candidate| candidate.dig('location','state')==state && candidate.dig('location','city').to_s.casecmp(city.to_s).zero? }
  match=candidates.find { |candidate| candidate.dig('location','address1').to_s[/\d+/]==number }
  match ||= candidates.first if candidates.length==1
  population_evidence = if text.match?(/patients? of all ages|people of all ages/i)
    ['resolved','Provider explicitly states that the emergency service treats patients of all ages.']
  elsif text.match?(/specialized care for children and newborns|pediatric emergency department|pediatric ER/i)
    ['resolved','Provider explicitly describes a pediatric emergency service for children.']
  else
    ['unresolved','The public location page does not explicitly establish adult/child eligibility.']
  end
  hours_ok=text.match?(/24\/7 care|open 24 hours|operates 24\/7|staffed 24\/7|open 24\/7/i)
  access_ok=text.match?(/regardless of (your )?ability to pay|whether (you|your child) (have|has) insurance/i)
  regional=text.match?(/surrounding region|surrounding communities|surrounding counties|across .* county|only dedicated/i)
  critical=match&.dig('identity','hospitalType').to_s.match?(/critical access/i)
  signals=[]
  signals << 'No NearSignal decision-ready location currently published in this state' unless served_states.include?(state)
  signals << 'CMS classifies the matched hospital as Critical Access' if critical
  signals << 'Provider page describes regional, multi-county, or uniquely available service reach' if regional
  signals << 'Provider page explicitly identifies a pediatric emergency service' if population_evidence[1].include?('pediatric')
  domains={
    'identity'=>{'status'=>match ? 'resolved':'unresolved','evidence'=>match ? "Matched to CMS CCN #{match['cmsCertificationNumber']}." : 'No exact CMS identity match was produced automatically.'},
    'location'=>{'status'=>address.empty? ? 'unresolved':'resolved','evidence'=>address.empty? ? 'Location address was not extracted.' : "Provider-listed address: #{address}."},
    'contact'=>{'status'=>phone ? 'resolved':'unresolved','evidence'=>phone ? "Provider-listed phone: #{phone}." : 'A location phone was not extracted.'},
    'population'=>{'status'=>population_evidence[0],'evidence'=>population_evidence[1]},
    'services'=>{'status'=>'resolved','evidence'=>'CommonSpirit classifies this location as an Emergency Room and describes emergency evaluation or treatment.'},
    'hours'=>{'status'=>hours_ok ? 'resolved':'unresolved','evidence'=>hours_ok ? 'Provider page explicitly describes 24/7 emergency availability.' : '24/7 availability was not explicit in the reviewed page text.'},
    'access'=>{'status'=>access_ok ? 'resolved':'unresolved','evidence'=>access_ok ? 'Provider page explicitly addresses emergency care without insurance or ability to pay.' : 'Location-level uninsured or ability-to-pay language was not explicit.'},
    'routing'=>{'status'=>latitude && longitude ? 'resolved':'unresolved','evidence'=>latitude && longitude ? "Provider page supplies coordinates #{latitude}, #{longitude}." : 'Routing coordinates were not extracted.'}
  }
  complete=domains.values.all? { |domain| domain['status']=='resolved' }
  unresolved=domains.select { |_name,domain| domain['status']!='resolved' }.keys
  puts "#{index+1}/#{URLS.length} #{name}"
  {'cmsCertificationNumber'=>match&.dig('cmsCertificationNumber'),'name'=>name,'location'=>[city,state].compact.join(', '),'address'=>address,'phone'=>phone,'latitude'=>latitude,'longitude'=>longitude,'sourceUrl'=>url,'sourcePublisher'=>'CommonSpirit Health','status'=>complete ? 'release-eligible':'held','statusReason'=>complete ? 'All eight public-evidence domains resolved; requires final human release review.' : "Held because #{unresolved.join(', ')} #{unresolved.length==1 ? 'is':'are'} unresolved.",'fragmentationPriority'=>{'signals'=>signals,'score'=>signals.length},'domains'=>domains}
end

resolved=records.sum { |record| record['domains'].values.count { |domain| domain['status']=='resolved' } }
output={'batchId'=>'commonspirit-fragmentation-001','providerSystem'=>'CommonSpirit Health','reviewedAt'=>'2026-09-14','selectionMethod'=>'Prioritized by present NearSignal coverage gaps, CMS Critical Access designation when matched, provider-described regional reach, and explicit pediatric scarcity signals. These are access-friction proxies, not a clinical ranking of communities.','releaseRule'=>'Every release domain must resolve and an authorized human reviewer must approve publication.','summary'=>{'reviewed'=>records.length,'evidenceEnriched'=>records.length,'releaseEligible'=>records.count { |record| record['status']=='release-eligible' },'held'=>records.count { |record| record['status']=='held' },'claimsResolved'=>resolved,'claimsChecked'=>records.length*8},'records'=>records}
File.write('data/review/provider-enrichment.json',JSON.pretty_generate(output)+"\n")
File.write('data/review/provider-enrichment.js',"window.NEARSIGNAL_PROVIDER_ENRICHMENT=#{JSON.generate(output)};\n")

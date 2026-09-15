require 'json'

dataset_path='data/v1/facilities.json'
web_path='data/facilities.js'
batch=JSON.parse(File.read('data/review/provider-enrichment.json'))
dataset=JSON.parse(File.read(dataset_path))
web_source=File.read(web_path)
web=JSON.parse(web_source[/window\.CARE_ROUTE_FACILITIES = (\[.*\]);/m,1])
eligible=batch['records'].select { |record| record['status']=='release-eligible' }
timezone={'AR'=>'America/Chicago','AZ'=>'America/Phoenix','CA'=>'America/Los_Angeles','GA'=>'America/New_York','KY'=>'America/New_York','NV'=>'America/Los_Angeles'}

def slug(name)
  name.downcase.gsub(/[^a-z0-9]+/,'-').gsub(/^-|-$/,'')
end

eligible.each do |record|
  id="commonspirit-#{record['cmsCertificationNumber']}-#{slug(record['location'])}"
  next if dataset['facilities'].any? { |facility| facility['id']==id }
  address=record['address'].strip
  parts=address.split(',').map(&:strip)
  street=parts[0..-3].join(', ')
  city=parts[-2]
  state,zip=parts[-1].split(/\s+/,2)
  pediatric=record.dig('domains','population','evidence').match?(/pediatric|children/i)
  all_ages=record.dig('domains','population','evidence').match?(/all ages/i)
  groups=pediatric&&!all_ages ? ['pediatric'] : ['adult','pediatric']
  type_label=groups==['pediatric'] ? 'Pediatric emergency department' : 'Adult and pediatric emergency department'
  phone=record['phone'].to_s.gsub(/\D/,'')
  facility={
    'id'=>id,
    'externalIds'=>{'cmsCcn'=>record['cmsCertificationNumber']},
    'identity'=>{'name'=>record['name'],'organization'=>'CommonSpirit Health network','type'=>'emergency','typeLabel'=>type_label,'pediatricSpecific'=>groups==['pediatric'],'patientGroups'=>groups},
    'location'=>{'address1'=>street,'city'=>city,'state'=>state,'postalCode'=>zip,'latitude'=>record['latitude'],'longitude'=>record['longitude']},
    'contact'=>{'phone'=>phone,'website'=>record['sourceUrl'],'bookingUrl'=>nil},
    'pediatricAge'=>{'minimumMonths'=>nil,'maximumMonths'=>nil,'limitsVerified'=>false},
    'capabilities'=>['illness','breathing','injury','wound','stomach','other'],
    'hours'=>{'kind'=>'always','timezone'=>timezone[state],'label'=>'Open 24 hours','weekly'=>{}},
    'highlights'=>[type_label,'Provider explicitly publishes 24/7 emergency availability','Provider publishes emergency access without insurance or ability to pay'],
    'live'=>{'waitMinutes'=>nil,'acceptingPatients'=>nil},
    'insurance'=>{'status'=>'verify','plans'=>[]},
    'quality'=>{'displayScore'=>nil,'note'=>'No comparable public emergency-care quality score is displayed.','sourceUrl'=>nil},
    'access'=>{'uninsuredWelcome'=>true,'slidingFee'=>false,'noOneTurnedAway'=>true,'charityCare'=>false,'flatFee'=>nil,'languages'=>[],'note'=>'Emergency care is provided regardless of insurance or ability to pay; financial assistance may be available. Verify plan participation and financial-assistance terms.','sourceUrl'=>record['sourceUrl']},
    'verification'=>{'status'=>'verified-with-unknowns','reviewedAt'=>'2026-09-14','reviewBy'=>'2026-12-14','method'=>'cms-match-and-authoritative-provider-source'},
    'evidence'=>[{'id'=>"#{id}-provider",'url'=>record['sourceUrl'],'publisher'=>'CommonSpirit Health','supports'=>['identity','location','contact','capabilities','hours','highlights','access','patientGroups'],'checkedAt'=>'2026-09-14'}]
  }
  dataset['facilities'] << facility
  web << {
    'id'=>id,'name'=>facility.dig('identity','name'),'city'=>city,'state'=>state,'type'=>'emergency','typeLabel'=>type_label,'pediatricSpecific'=>facility.dig('identity','pediatricSpecific'),'patientGroups'=>groups,
    'address'=>"#{street}, #{city}, #{state} #{zip}",'coordinates'=>{'lat'=>record['latitude'],'lon'=>record['longitude']},'phone'=>phone.sub(/(\d{3})(\d{3})(\d{4})/,'(\1) \2-\3'),
    'age'=>{'minMonths'=>nil,'maxMonths'=>nil,'verifiedLimits'=>false},'capabilities'=>facility['capabilities'],'hours'=>{'kind'=>'always','label'=>'Open 24 hours','days'=>{}},'highlights'=>facility['highlights'],'sourceUrl'=>record['sourceUrl'],
    'quality'=>{'note'=>facility.dig('quality','note'),'url'=>nil},'access'=>facility['access'],'verification'=>facility['verification']
  }
end

dataset['datasetVersion']='2026-09-14.1'
dataset['reviewedAt']='2026-09-14'
File.write(dataset_path,JSON.pretty_generate(dataset)+"\n")
header="// Generated from data/v1/facilities.json. Do not edit by hand.\nwindow.CARE_ROUTE_DATASET = #{JSON.pretty_generate({'datasetVersion'=>'2026-09-14.1','reviewedAt'=>'2026-09-14'})};\n"
File.write(web_path,"#{header}window.CARE_ROUTE_FACILITIES = #{JSON.pretty_generate(web)};\n")
puts "Promoted #{eligible.length} CommonSpirit locations; patient-facing total is #{web.length}."

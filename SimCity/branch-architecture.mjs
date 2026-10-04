import {commercialBuilding} from './commercial-architecture.mjs';
import {residentialBuilding} from './residential-architecture.mjs';
import {industrialBuilding} from './industrial-architecture.mjs';

// Every branch uses the same authored model in the city and evolution gallery.
export function branchBuilding({far=false,...options}){
 const o={...options,detail:far?1:2};
 return residentialBuilding(o)||commercialBuilding(o)||industrialBuilding(o);
}

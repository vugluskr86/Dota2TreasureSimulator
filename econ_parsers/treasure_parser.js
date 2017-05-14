const data = require('./items_game.json')
const fs = require('fs')
const drop_rate = ["common", "very_rare","extra_rare","unusual"]

const treasures = [];


const items =  data["items_game"]["items"];
const loot_lists = data["items_game"]["loot_lists"];
const reserved_names = ["add_random_gems","add_empty_socket","hero_gems_only", "can_have_duplicates","grant_one_of_each_item", "treasure_settings"]

const itemsKeys = Object.keys(items)

console.log("Parsing ", itemsKeys.length," items.")

function IsTreasure(prefab, name) {
    return (prefab === "treasure_chest" || prefab === "retired_treasure_chest") && name.indexOf('Autographed') === -1 && name.indexOf('Summer Sale')
}

function ParseLootList(treasure, loot_list_name, spawn_list) {
    if(!spawn_list) {
	const loots_dict = loot_lists[loot_list_name]
	if(loots_dict) {
	    //console.log( Object.keys(loots_dict) )
	    Object.keys(loots_dict).filter(function(i){ return reserved_names.indexOf(i) === -1 }).forEach(function(loot_key){
		const loot_value = loots_dict[loot_key]
		if(loot_key === "additional_drop") {
		    if(loot_value["item"]) {
			if(!loot_value["item"]) { console.log(loot_list_name, spawn_list) }

			ParseLootList(treasure, loot_value["item"], "extra_rare");
		    } else {
			if(!loot_value["loot_list"]) { console.log(loot_list_name, spawn_list) }

			if(loot_key.indexOf("courier") !== -1) {
			    ParseLootList(treasure, loot_value["loot_list"], "unusual");
			} else {
			    ParseLootList(treasure, loot_value["loot_list"], "extra_rare");
			}
		    }
		} else if(loot_key === "escalating_chance_drop") {
		    
		} else {
		    //if(!loot_key) { console.log(loot_list_name, spawn_list) }
		    
		    if(loot_lists[loot_key]) {
			if(!loot_lists[loot_key]) { console.log(loot_list_name, spawn_list) }

//			console.log( loot_lists[loot_key] )
			ParseLootList(treasure, loot_key, "common");
		    } else {
			treasure.common_loot.push({ name : loot_key, drop_rate : "common" })
		    }
		}
	    })
	} else {
	    throw "Warning! : Empty treasure:"+treasure.name + "," +loot_list_name
	}
    } else {
	if(!loot_list_name) { console.log(loot_list_name, spawn_list) }
	const loots_dict1 = loot_lists[loot_list_name]
	if(loots_dict1) {
	    Object.keys(loots_dict1).filter(function(i){ return reserved_names.indexOf(i) === -1 }).forEach(function(loot_key) {
		if(loot_key === "additional_drop") {
		    if(loots_dict1["item"]) {
			if(!loots_dict1["item"]) { console.log(loot_list_name, spawn_list) }
			ParseLootList(treasure, loots_dict1["item"], spawn_list);
		    } else {
			if(!loots_dict1["loot_list"]) { console.log(loot_list_name, spawn_list, loots_dict1) }
			if(loots_dict1["loot_list"]) {
			    ParseLootList(treasure, loots_dict1["loot_list"], spawn_list)
			} else {
			    // ParseLootList(treasure, loot_list_name, spawn_list);
			}
			// ParseLootList(treasure, loots_dict1["loot_list"], spawn_list);
		    }
		} else if(loot_key === "escalating_chance_drop") {
		} else {
		    if(!loot_key) { console.log(loot_list_name, spawn_list) }
		    ParseLootList(treasure, loot_key, spawn_list)
		}
	    })
	} else if(loot_list_name === "additional_drop") {
	    console.log(loots_dict1, loot_list_name, spawn_list)
            if(loots_dict1["item"]) {
	    	ParseLootList(treasure, loots_dict1["item"], spawn_list);
	    } else {
		if(loot_key.indexOf("courier") !== -1) {
	            ParseLootList(treasure, loots_dict1["loot_list"], spawn_list);
		} else {
		    ParseLootList(treasure, loots_dict1["loot_list"], spawn_list);
	        }
	    }
	} else if(loot_list_name === "escalating_chance_drop") {} else {
	    switch(spawn_list) {
		case 'common': { treasure.common_loot.push({ name : loot_list_name, drop_rate : spawn_list }); break; }
		case 'extra_rare' : { treasure.extra_rare_loot.push({ name : loot_list_name, drop_rate : spawn_list }); break; }
		case 'unusual' : { treasure.unusual_loot.push({ name : loot_list_name, drop_rate : spawn_list }); break; }
		case 'very_rare' : { treasure.very_rare_loot.push({ name : loot_list_name, drop_rate : spawn_list }); break; }
	    }
	}
    }
    return treasure
}


function CheckTreasureDrop(treasure) {
//    console.log(treasure.name);
    function _Check(list) {
	var result = true;
//	console.log(list);
	for(var i = 0; i < list.length; i++) {
	//    console.log(treasure.name, list[i]);
	    if( !list[i].name ) { result = false; break; }
	    if( itemsKeys.indexOf( list[i].name ) === -1 ) { result = false; break; }
	}
	return result
    }

    return _Check(treasure.common_loot) || _Check(treasure.extra_rare_loot) || _Check(treasure.unusual_loot) || _Check(treasure.very_rare_loot);
}

for(var iK = 0; iK < itemsKeys.length; iK++)
{
    const key  = itemsKeys[iK]
    const item = items[key]
    try {
	if(!item.prefab) {
	    throw "Unexpeced item prefab: " + key
	}
	const prefab = item.prefab
	const name = item.name
	if(IsTreasure(prefab, name)) {
	    const treasure = {}
	    treasure.name = name
	    treasure.id = key
	    treasure.common_loot = []
	    treasure.very_rare_loot = []
	    treasure.extra_rare_loot = []
	    treasure.unusual_loot = []
	    treasure.prefab = []
	    if(item.price_info) treasure.price_info = item.price_info
	    treasure.creation_date = item.creation_date ? item.creation_date : "1970-01-01"    
	    const static_attributes = item["static_attributes"]
	    if(static_attributes && static_attributes["treasure loot list"]) {
		const loot_list_name = static_attributes["treasure loot list"]["value"];
		var t = ParseLootList(treasure, loot_list_name)
		if(CheckTreasureDrop(t)) {
		    treasures.push(t)
		} else {
		    throw "Shit happens: " + key
		}
	    }
	}
    } catch(e) {
	console.log("Warning while parsing items:", e, ".Shit happens, don't worry, treasure skipped")
	continue;
    }
}
//console.log(treasures[0])
console.log("Treasures result:", treasures.length)

fs.writeFileSync( __dirname + "/treasures.json", JSON.stringify(treasures, null, 4) )
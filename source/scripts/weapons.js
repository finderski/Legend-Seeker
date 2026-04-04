// Sheet Workers for Weapons
//--------------------------
//rereating_weapons_weapon = Weapon Name
//repeating_weapons_weapon-atk = Total ATK (Heroic Proficiency Bonus + Attack Bonus from Str/Dex + Misc Modifiers)
//repeating_weapons_weapon-atk-bonus = ATK Attack Bonus (e.g. STR/STRx2/DEX)
//  - str
//  - strx2
//  - dex
//repeating_weapons_weapon-misc-mod = ATK Miscellaneous Attack Modifier (from magic items, etc.)
//repeating_weapons_weapon-type = Weapon Type (Melee, Ranged)
//repeating_weapons_weapon-damage = Weapon Damage (e.g. 1d6)
//repeating_weapons_weapon-crit = Weapon Critical (e.g. 20 or lowest natural roll on a d20 for a critical hit)
//repeating_weapons_attack_formula = Formula for calculating attack (e.g. "HPB + STR/DEX + Misc Mod")

on('change:repeating_weapons:weapon change:repeating_weapons:weapon-atk-bonus change:repeating_weapons:weapon-misc-mod change:heroic-proficiency-bonus', function(eventInfo) {
    log('Repeating Weapons Change Triggered by: ' + eventInfo.sourceAttribute, r20color);
    console.log(eventInfo);
    const fields = [];
    if (eventInfo.sourceAttribute === 'heroic-proficiency-bonus') {
        // Heroic Proficiency Trigger - must update ALL weapons
        getSectionIDs('repeating_weapons', function(ids) {
            ids.forEach(function(id) {
                calculateWeaponAttack(id);
            });
        });
    }
    else {
        // Grab only the values for the current weapon
        fields.push("heroic_proficiency_bonus","repeating_weapons_weapon-atk-bonus","repeating_weapons_weapon-misc-mod", "strength_modifier", "dexterity_modifier", "repeating_weapons_weapon-type");
        console.log('Fields to get: ', fields);
        getAttrs(fields, function(values) {
            console.log(values);
            const setattrs = {};
            const hpb = parseInt(values['heroic_proficiency_bonus']) || 0;
            const miscMod = parseInt(values['repeating_weapons_weapon-misc-mod']) || 0;
            const attributeBonus = values['repeating_weapons_weapon-atk-bonus'];
            const atkBonus = attributeBonus === 'str' ? parseInt(values['strength_modifier']) || 0 :
                            attributeBonus === 'strx2' ? 2 * (parseInt(values['strength_modifier']) || 0) :
                            attributeBonus === 'dex' ? parseInt(values['dexterity_modifier']) || 0 : 0;

            const totalAtk = hpb + atkBonus + miscMod;
            setattrs['repeating_weapons_weapon-atk'] = totalAtk;
            setAttrs(setattrs);
        });
    }
});

// Function to update Half-Level and Heroic Proficiency when they change after the sheet has been opened.
function updateWeapons(derivedStat) {
    const fields = [
        "half-level",
        `${skill}_attribute`,
        `${skill}_trained`,
        `${skill}_focus`,
        `${skill}_misc`,
        `${skill}_ability`
    ];

    const allFields = [...fields, ...listOfAttributes];
    // log(`list of fields to retrieve`, allFields, r20color);

    getAttrs(allFields, function(values) {
        //log(`Values retrieved for skill ${skill}`, values, r20color);
        //console.log(`Values retrieved for skill ${skill}:`, values);
        const attribute = values[`${skill}_ability`].split("_")[0].replace("@", "").replace("{", "").replace("}", ""); // Extract the attribute name from the skill's linked attribute field
        //log(`Attribute for Skill ${skill}`, attribute, derivedStatsColor);
        //log("value of attribute modifier", values[`${attribute}_modifier`], derivedStatsColor);
        const halfLevel = parseInt(values["half-level"], 10) || 0;
        const trained = parseInt(values[`${skill}_trained`], 10) || 0;
        const focus = parseInt(values[`${skill}_focus`], 10) || 0;
        const misc = parseInt(values[`${skill}_misc`], 10) || 0;
        const abilityMod = parseInt(values[`${attribute}_modifier`], 10) || 0;

        setAttrs({
            [`${skill}_bonus`]: halfLevel + trained + focus + misc + abilityMod
        });
    });
}
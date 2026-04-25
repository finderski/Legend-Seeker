// Sheet Workers for Weapons
//--------------------------
//rereating_weapons_weapon = Weapon Name
//repeating_weapons_weapon-atk = Total ATK (Base Attack Bonus + Attack Bonus from Str/Dex + Misc Modifiers)
//repeating_weapons_weapon-atk-bonus = ATK Attack Bonus from Attribute Modifiers (e.g. Str, Dex, etc.)
//repeating_weapons_weapon-misc-mod = ATK Miscellaneous Attack Modifier (from magic items, etc.)
//repeating_weapons_weapon-type = Weapon Type (Melee, Ranged)
//repeating_weapons_weapon-damage = Weapon Damage (e.g. 1d6)
//repeating_weapons_weapon-crit = Weapon Critical (e.g. 20 or lowest natural roll on a d20 for a critical hit)
//repeating_weapons_attack_formula = Formula for calculating attack (e.g. "HPB + STR/DEX + Misc Mod")

// Function to update Half-Level and Heroic Proficiency when they change after the sheet has been opened.

// listOfAttributes - contains all Attribute Modifier Fields (e.g. strength_modifier, dexterity_modifier, etc.)
// damageFields - contains all fields that are part of the damage calculation for a weapon
// atkFields - contains all fields that are part of the attack calculation for a weapon

function updateWeapons(fields, section, id) {
    // NOTE: fields should be passed in with repeating_weapons prefixed (e.g. repeating_weapons_weapon-damage-dice) and without the 
    // row ID (e.g. -abc123).
    // Before doing any updates or getAttrs, may need to .replace('repeating_weapons', `repeating_weapons_${id}`) to ensure getting 
    // the correct fields for the correct weapon row.
    // And doing the replace should avoid adding repeating_weapons to a field we may need to get from outside of the repeating section 
    // (e.g. half-level, base_attack_bonus, strength_modifier, etc.)

    // NOTE: section should be atk, dmg, or all to determine which fields to update and which calculations to do. If section is all, 
    // then update all fields and do all calculations. If section is atk, then only update atk fields and do atk calculation. If 
    // section is dmg, then only update dmg fields and do dmg calculation.

    // Make sure fields and sction aren't empty or null before proceeding.

    log("updateWeapons function called with variables: ", `fields: ${fields}, section: ${section}, id: ${id}`, r20color);

    if (!fields || fields.length === 0) {
        log("No fields provided for updateWeapons function. Exiting function.", '', r20color);
        return;
    }
    if (!section || section === '') {
        log("No section provided for updateWeapons function. Exiting function.", '', r20color);
        return;
    }    
    //row id must be passed to the function as only one row will be processed at a time.
    // Update only the row with the specified id
    //fields = fields.map(field => field.replace('repeating_weapons', `repeating_weapons_${id}`));
    // Updated ID Append Logic:
    fields = fields.map(field => {
        if (
            field.startsWith('repeating_weapons') &&
            !field.startsWith(`repeating_weapons_${id}_`)
        ) {
            return field.replace('repeating_weapons', `repeating_weapons_${id}`);
        }
        return field;
        });
    // Now get the attributes and do the calculations for the specified weapon row
    getAttrs(fields, function(values) {
        log("Half Level and HPB", `Half Level: ${values['half-level']}, Base Attack Bonus: ${values['base_attack_bonus']}`, r20color);
        const updateHalfLevel = values['half-level'] || values['half-level'] === '0' || values['half-level'] === 0 ? parseInt(values['half-level']) || 0 : 'skip';
        const halfLevel = values['half-level'] || values['half-level'] === '0' || values['half-level'] === 0 ? parseInt(values['half-level']) || 0 : parseInt(values[`repeating_weapons_${id}_weapon-half-level`]) || 0;
        const updateHeroicProficiencyBonus = values['base_attack_bonus'] || values['base_attack_bonus'] === '0' || values['base_attack_bonus'] === 0 ? parseInt(values['base_attack_bonus']) || 0 : 'skip';
        const heroicProficiencyBonus = values['base_attack_bonus'] || values['base_attack_bonus'] === '0' || values['base_attack_bonus'] === 0 ? parseInt(values['base_attack_bonus']) || 0 : parseInt(values[`repeating_weapons_${id}_weapon-base-attack-bonus`]) || 0;
        log("Base Attack Bonus Value After process", `Base Attack Bonus: ${heroicProficiencyBonus}, type: ${typeof(heroicProficiencyBonus)}`, r20color);
        const setattrs = {};
        switch(updateHalfLevel) {
            case 'skip':
                break;
            default:
                setattrs[`repeating_weapons_${id}_weapon-half-level`] = updateHalfLevel;
        }
        switch(updateHeroicProficiencyBonus) {
            case 'skip':
                break;
            default:
                setattrs[`repeating_weapons_${id}_weapon-base-attack-bonus`] = updateHeroicProficiencyBonus;
        }
        //set up Attribute Modifiers
        const strengthMod = parseInt(values['strength_modifier']) || 0;
        const dexterityMod = parseInt(values['dexterity_modifier']) || 0;
        const constitutionMod = parseInt(values['constitution_modifier']) || 0;
        const intelligenceMod = parseInt(values['intelligence_modifier']) || 0;
        const wisdomMod = parseInt(values['wisdom_modifier']) || 0;
        const charismaMod = parseInt(values['charisma_modifier']) || 0;
        log("damage attr mod",values[`repeating_weapons_${id}_weapon-damage-attribute-mod`], deltaColor);
        const damageAttributeMod = values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'none' ? 0 :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'strength_modifier' ? strengthMod :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'strength_modifier_x2' ? strengthMod * 2 :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'dexterity_modifier' ? dexterityMod :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'dexterity_modifier_x2' ? dexterityMod * 2 :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'constitution_modifier' ? constitutionMod :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'intelligence_modifier' ? intelligenceMod :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'wisdom_modifier' ? wisdomMod :
                                    values[`repeating_weapons_${id}_weapon-damage-attribute-mod`] === 'charisma_modifier' ? charismaMod : 0;
        log("Damage Attribute Modier Value", `${damageAttributeMod}, type: ` + typeof(damageAttributeMod), deltaColor);
        const atkBonus = values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'none' ? 0 :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'strength_modifier' ? strengthMod :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'dexterity_modifier' ? dexterityMod :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'constitution_modifier' ? constitutionMod :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'intelligence_modifier' ? intelligenceMod :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'wisdom_modifier' ? wisdomMod :
                                    values[`repeating_weapons_${id}_weapon-atk-bonus`] === 'charisma_modifier' ? charismaMod : 0;

        log("ATK and Damage Attribute Modifiers Retrieved", `ATK Attribute Mod: ${atkBonus}, Damage Attribute Mod: ${damageAttributeMod}`, r20color);
        // Damage Fields to Set Up
        if (section === 'dmg' || section === 'all') {
            const damageDice = values[`repeating_weapons_${id}_weapon-damage-dice`] || '';
            const damageMiscMod = parseInt(values[`repeating_weapons_${id}_weapon-damage-misc-mod`]) || 0;
            const validDice = checkDiceExpression(damageDice);
            log("Damage Fields Retrieved", `Damage Dice: ${damageDice} (Valid: ${validDice}), Damage Attribute Mod: ${damageAttributeMod}, Damage Misc Mod: ${damageMiscMod}`, r20color);
            // calculate Damage
            let damageTotal = validDice ? damageDice : '';
            const damageSum = damageMiscMod + halfLevel + damageAttributeMod;
            damageTotal += damageSum > 0 ? " + " + damageSum : '';
            log('Showing Work for Damage Calculation', `Damage Dice: ${damageDice}, Attribute Mod: ${damageAttributeMod}, Misc Mod: ${damageAttributeMod}, Half-Level: ${halfLevel}, Total Damage: ${damageTotal}`, r20color);
            setattrs[`repeating_weapons_${id}_weapon-damage`] = damageTotal;
            setattrs[`repeating_weapons_${id}_damage-attribute-mod-value`] = damageAttributeMod;
        }

        // ATK Fields to Set Up
        if (section === 'atk' || section === 'all') {
            const atkMiscMod = parseInt(values[`repeating_weapons_${id}_weapon-misc-mod`]) || 0;

            // calculate ATK
            let atkTotal = heroicProficiencyBonus + atkMiscMod + atkBonus;
            log('Showing Work for ATK Calculation', `HPB: ${heroicProficiencyBonus}, Atk Bonus: ${atkBonus}, Atk Misc Mod: ${atkMiscMod}, Total ATK: ${atkTotal}`, r20color);
            setattrs[`repeating_weapons_${id}_weapon-atk`] = atkTotal;
            log("Values to be set", JSON.stringify(setattrs), r20color);
        }
        setAttrs(setattrs);
    });
}

// Watch for a new weapon to be added and set the half-level and Base Attack Bonus for that weapon.
on('change:repeating_weapons:weapon', function(eventInfo) {
    log('Repeating Weapons Change Triggered by: ' + eventInfo.sourceAttribute, r20color);
    const fields = ['half-level', 'base_attack_bonus'];
    //assume new weapon, so need to set up the damage and atk sections
    fields.push(...damageFields, ...atkFields, ...listOfAttributes);
    const id = eventInfo.sourceAttribute.split('_')[2];
    const section = 'all';
    log("New Weapon Added. Updating all fields for new weapon with id: " + id, r20color);
    updateWeapons(fields, section, id)
    log('Processed','Used updateWeapons,r20color');
});

// Watch for changes to Damage Fields to Update Total Damage
on('change:repeating_weapons:weapon-damage-dice change:half-level change:repeating_weapons:weapon-damage-attribute-mod change:repeating_weapons:weapon-damage-misc-mod', function(eventInfo) {
    log('Repeating Weapons Change Triggered by: ' + eventInfo.sourceAttribute, r20color);
    // if half-level, then all weapons need to be updated, otherwise just the current weapon needs to be updated
    if (eventInfo.sourceAttribute === 'half-level') {
        // Heroic Proficiency Trigger - must update ALL weapons
        const fields = ['half-level', ...damageFields, ...listOfAttributes];
        const section = 'dmg';
        //const id = 'all';
        log("half-level Changed. Updating damage for all weapons.", r20color);
        getSectionIDs('repeating_weapons', function(ids) {
            ids.forEach(function(id) {
                updateWeapons(fields, section, id);
            });
        });
        log('Processed','Used updateWeapons,r20color');
    }
    else {
        // Grab only the values for the current weapon
        const fields = damageFields.map(field => field.replace('repeating_weapons', `repeating_weapons_${eventInfo.sourceAttribute.split('_')[2]}`));
        fields.push(...listOfAttributes);
        const section = 'dmg';
        const id = eventInfo.sourceAttribute.split('_')[2];
        log("Damage Field Changed. Updating damage for weapon with id: " + id, r20color);
        updateWeapons(fields, section, id);
        log('Processed','Used updateWeapons,r20color');
    }
});


// Watch for Changes to ATK Fields to Update Total ATK
on('change:base_attack_bonus change:repeating_weapons:weapon-atk-bonus change:repeating_weapons:weapon-misc-mod change:heroic-proficiency-bonus', function(eventInfo) {
    log('Repeating Weapons Change Triggered by: ' + eventInfo.sourceAttribute, r20color);
    // if hpb, then all weapons need to be updated, otherwise just the current weapon needs to be updated
    if (eventInfo.sourceAttribute === 'base_attack_bonus') {
        // Heroic Proficiency Trigger - must update ALL weapons
        const fields = ['base_attack_bonus', ...atkFields, ...listOfAttributes];
        const section = 'atk';
        //const id = 'all';
        log("Base Attack Bonus Changed. Updating attack for all weapons.", r20color);
        getSectionIDs('repeating_weapons', function(ids) {
            ids.forEach(function(id) {
                updateWeapons(fields, section, id);
            });
        });
        log('Processed','Used updateWeapons,r20color');
    }
    else {
        // Grab only the values for the current weapon
        const fields = atkFields.map(field => field.replace('repeating_weapons', `repeating_weapons_${eventInfo.sourceAttribute.split('_')[2]}`));
        fields.push(...listOfAttributes);
        const section = 'atk';
        const id = eventInfo.sourceAttribute.split('_')[2];
        log("Attack Field Changed. Updating attack for weapon with id: " + id, r20color);
        updateWeapons(fields, section, id);
        log('Processed','Used updateWeapons,r20color');
    }
});

on(`change:${listOfAttributes.join(' change:')}`, function(eventInfo) {
    log('Weapon Attribute Modifier Change Triggered by: ' + eventInfo.sourceAttribute, r20color);
    getSectionIDs('repeating_weapons', function(ids) {
        ids.forEach(function(id) {
            updateWeapons([...damageFields, ...listOfAttributes], 'dmg', id);
            updateWeapons([...atkFields, ...listOfAttributes, 'base_attack_bonus'], 'atk', id);
        });
    });
});

// Better Logging Functionality
const log = (
    title,
    text,
    color = 'green',
    headerstyle = 'font-size:14px; font-weight:bold;',
    bodystyle = 'font-size:12px; font-weight:normal;'
) => {
    let titleStyle = `color:${color}; ${headerstyle} text-decoration:underline;`;
    let textStyle = `color:${color}; ${bodystyle}`;
    const output = `%c${title}:%c ${text}`;
    console.log(output, titleStyle, textStyle);
};

/* Common Functions for Workers Goes Here */

/* ensure created row ids are unique even if created in rapid succession */
const createUniqueID = row_ids => {
    row_ids = Array.ids ? row_ids : [];
    let generated;
    while (!generated || row_ids.includes(generated)) {
        generated = generateRowID();
    }
    row_ids.push(generated);
    return generated;
}

// Simple Sum function for repeating sections with check field
function repeatingSimpleSumWCheck(
    section,
    field,
    destination,
    checkfield,
    checkvalue
) {
    let repSection = 'repeating_' + section;
    getSectionIDs(repSection, function (idArray) {
        //Construct Array of fields to get attributes for...
        let sumFields = [];
        let checkFields = [];
        for (let a = 0; a < idArray.length; a++) {
            sumFields[sumFields.length] = repSection + '_' + idArray[a] + '_' + field;
            checkFields[checkFields.length] =
                repSection + '_' + idArray[a] + '_' + checkfield;
        }

        getAttrs(sumFields, function (v) {
            getAttrs(checkFields, function (c) {

                var sumTotal = 0;
                for (a = 0; a < idArray.length; a++) {
                    if (c[checkFields[a]] === checkvalue) {
                        sumTotal += parseFloat(v[sumFields[a]]) || 0;
                    }
                }
                var setSumValue = {};
                setSumValue[destination] = sumTotal;
                setAttrs(setSumValue);
            });
        });
    });
}

const checkDiceExpression = (expression) => {
    const dicePattern = /^\d+(d\d+)?([+-]\d+)?$/i;
    log("Dice Expression Check", dicePattern.test(expression), deltaColor);
    return dicePattern.test(expression);
}

coreAttributes.forEach(attribute => {
    on(`change:${attribute}`, function (eventInfo) {
        const attScore = Math.floor((parseInt(eventInfo.newValue) || 0));
        let modScore;
        modScore = attScore < 2 ? -5 :
                   attScore < 4 ? -4 :
                   attScore < 6 ? -3 :
                   attScore < 8 ? -2 :
                   attScore < 10 ? -1 :
                   attScore < 12 ? 0 :
                   attScore < 14 ? 1 :
                   attScore < 16 ? 2 :
                   attScore < 18 ? 3 :
                   attScore < 20 ? 4 :
                   attScore < 22 ? 5 :
                   attScore < 24 ? 6 :
                   attScore < 26 ? 7 :
                   attScore < 28 ? 8 :
                   attScore < 30 ? 9 : 10;
        log("Modifier", modScore, derivedStatsColor)
        const attrsToSet = {};
        attrsToSet[`${attribute}_modifier`] = modScore;
        setAttrs(attrsToSet);
    });
});

// Heroic Proficiency Bonus Calculation
/*
on('change:level', function(eventInfo) {
    const level = parseInt(eventInfo.newValue) || 0;
    let hpb = level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6;
    setAttrs({ "base_attack_bonus": hpb });
});
*/

// Update Corruption
on('change:wisdom change:corruption_0 change:corruption_1 change:corruption_2 change:corruption_3 change:corruption_4 change:corruption_5 change:corruption_6 change:corruption_7 change:corruption_8 change:corruption_9 change:corruption_10 change:corruption_11 change:corruption_12 change:corruption_13 change:corruption_14 change:corruption_15 change:corruption_16 change:corruption_17 change:corruption_18 change:corruption_19 change:corruption_20 change:corruption_21 change:corruption_22 change:corruption_23 change:corruption_24', function(eventInfo) {
    //log('Corruption Watch Detected Change', JSON.stringify(eventInfo), r20color);
    if (eventInfo.sourceAttribute === 'wisdom') {
        // update the number of corruption slots
        const wisdomScore = Math.floor((parseInt(eventInfo.newValue) || 0));
        const setattrs = {};
        for(let i=0; i <= 24; i++) {
            // while i is the less than 24, hide the lock inputs
            if (i <= wisdomScore) {
                setattrs[`corruption_lock_${i}`] = 'show';
            } else {
                setattrs[`corruption_lock_${i}`] = 'hide';
            }
        }
        setAttrs(setattrs);
    }
    else {
        // update the shading of the corruption slots        const corruptionValue = parseInt(eventInfo.newValue) || 0;
        const setattrs = {};
        const corruptionValue = parseInt(eventInfo.sourceAttribute.split('_')[1]) || 0; // get the number from corruption_1, corruption_2, etc.
        //log("Corruption Value", corruptionValue, r20color);
        for(let i=0; i <= 24; i++) {
            if (i <= corruptionValue) {
                setattrs[`corruption_${i}`] = 'on';
            } else {
                setattrs[`corruption_${i}`] = 0;
            }
        }
        setAttrs(setattrs,{silent:true});
    }
    
});

// Watch for changes for Stamina Damage Threshold
on('change:fort_total change:stamina_miscbonus', function(eventInfo) {
    log("Threshold Watch Detected Change", eventInfo, r20color);
    damageThreshold();
    /*
    getAttrs(['fort_total', 'stamina_miscBonus'], function(v) {
        const fortTotal = parseInt(v.fort_total) || 0;
        const staminaMiscBonus = parseInt(v.stamina_miscBonus) || 0;
        const staminaDamageThreshold = fortTotal + staminaMiscBonus;
        const setattrs = {};
        setattrs['stamina_fortDef'] = fortTotal;
        setattrs['stamina_damageThreshold'] = staminaDamageThreshold
        setAttrs(setattrs);
    });
    */
});

// Watch for Changes to Condition to update Styling.
on('change:condition', function(eventInfo) {
    const conditionValue = eventInfo.newValue;
    const setattrs = {};
    setattrs['condition_selected'] = conditionValue;
    setAttrs(setattrs);
});

// Watch for Armor Changes
on('change:armor_worn change:armor_dex_cap', function(eventInfo) {
    log("Armor Watch Detected Change", eventInfo, r20color);
    getAttrs(['armor_worn', 'armor_dex_cap'], function(v) {
        const armorWorn = parseInt(v.armor_worn) || 0;
        const armorDexCap = parseInt(v.armor_dex_cap);
        let cappedDexMod = !armorWorn || isNaN(armorDexCap) ? '1000' : armorDexCap;
        setattrs = {};
        setattrs['capped_dex_mod'] = cappedDexMod;
        setattrs['dex_is_capped'] = !armorWorn ? 0 : isNaN(armorDexCap) ? 0 : 1;
        setAttrs(setattrs);
    });
});

on('change:armor_class change:armor_proficient_multiplier change:armor_worn change:shield_class change:shield_proficient_multiplier change:shield_worn', function() {
    getAttrs(['armor_class', 'armor_proficient_multiplier', 'armor_worn', 'shield_class', 'shield_proficient_multiplier', 'shield_worn'], function(v) {
        log("proficiencies", `armor proficient multiplier: ${v.armor_proficient_multiplier}, shield proficient multiplier: ${v.shield_proficient_multiplier}`, r20color);
        
        const armorClass = v.armor_class;
        const shieldClass = v.shield_class;
        const armorClassPenalty = armorClass === 'light' ? -2 : armorClass === 'medium' ? -5 : armorClass === 'heavy' ? -10 : 0;
        const shieldClassPenalty = shieldClass === 'light' ? -2 : shieldClass === 'medium' ? -5 : shieldClass === 'heavy' ? -10 : 0;
        log("Class Penalties", `armor class penalty: ${armorClassPenalty}, shield class penalty: ${shieldClassPenalty}`, r20color);
        const proficientMultiplier = parseInt(v.armor_proficient_multiplier) || 0;
        const shieldProficientMultiplier = parseInt(v.shield_proficient_multiplier) || 0;
        const armorWorn = parseInt(v.armor_worn) || 0;
        const shieldWorn = parseInt(v.shield_worn) || 0;
        const armorCheckPenalty = armorWorn ? armorClassPenalty * proficientMultiplier : 0;
        const shieldCheckPenalty = shieldWorn ? shieldClassPenalty * shieldProficientMultiplier : 0;
        const totalCheckPenalty = Math.abs(armorCheckPenalty) > Math.abs(shieldCheckPenalty) ? armorCheckPenalty : shieldCheckPenalty;
        setAttrs({ "armor_check_penalty": totalCheckPenalty });
    });
});

// Watch for Damage Reduction Changes
function calculateDR() {
    getAttrs(['armor_dr', 'shield_dr', 'armor_worn', 'shield_worn', 'armor_proficient_multiplier', 'shield_proficient_multiplier'], function(v) {
        const armorDR = parseInt(v.armor_dr) || 0;
        const shieldDR = parseInt(v.shield_dr) || 0;
        const armorWorn = parseInt(v.armor_worn) || 0;
        const shieldWorn = parseInt(v.shield_worn) || 0;
        const armorProficientMultiplier = (parseInt(v.armor_proficient_multiplier) || 0) ^ 1; // if proficient multiplier is 0, treat it as 1, if it's 1, treat it as 0
        const shieldProficientMultiplier = (parseInt(v.shield_proficient_multiplier) || 0) ^ 1; // if proficient multiplier is 0, treat it as 1, if it's 1, treat it as 0
        const totalDR = (armorDR * armorWorn * armorProficientMultiplier) + (shieldDR * shieldWorn * shieldProficientMultiplier);
        setAttrs({ "total_dr": totalDR });
    });
}

on('change:armor_dr change:shield_dr change:armor_worn change:shield_worn change:armor_proficient_multiplier change:shield_proficient_multiplier', function() {
    calculateDR();
});

// Watch for Defense Score Changes
const saveList = ['fort', 'ref', 'will'];
const fortFields = ['level', 'condition',  'armor_fort_defense','armor_worn', 'armor_proficient_multiplier', 'shield_proficient_multiplier', 'shield_fort_defense', 'shield_worn', 'fort_class_bonus', 'fort_ability_modifier', 'fort_misc_save_mod', 'fort_ability_mod', 'capped_dex_mod', ...listOfAttributes];
const fortWatch = `change:${fortFields.join(' change:')}`;

const refFields = ['level', 'condition',  'armor_level', 'armor_worn', 'armor_proficient_multiplier', 'shield_proficient_multiplier', 'shield_level', 'shield_worn', 'ref_class_bonus', 'ref_ability_modifier', 'ref_misc_save_mod', 'ref_ability_mod', 'capped_dex_mod', ...listOfAttributes];
const refWatch = `change:${refFields.join(' change:')}`;

const willFields = ['level', 'condition',  'armor_will_defense', 'armor_worn', 'armor_proficient_multiplier', 'shield_proficient_multiplier', 'shield_will_defense', 'shield_worn', 'will_class_bonus', 'will_ability_modifier', 'will_misc_save_mod', 'will_ability_mod', 'capped_dex_mod', ...listOfAttributes];
const willWatch = `change:${willFields.join(' change:')}`;

const watchMap = {
  fort: fortWatch,
  ref: refWatch,
  will: willWatch
};

const fieldsMap = {
  fort: fortFields,
  ref: refFields,
  will: willFields
};

saveList.forEach(save => {
    on(watchMap[save], function(eventInfo) {
        getAttrs(fieldsMap[save], function(v) {
            //was it an attribute modifier that triggered the change?
            log(`${save} Save Watch Detected Change`, JSON.stringify(eventInfo), r20color);
            let newCalcNeeded = false;
            if (coreAttributes.some(value => eventInfo.sourceAttribute.includes(value))) {
                log(`${save} Save Watch Detected Attribute Modifier Change`, eventInfo.sourceAttribute, r20color);
                //check to seee if the attribute modifier is what's currently used by this particular save
                const saveAbility = v[`${save}_ability_modifier`];
                const changedAttribute = eventInfo.sourceAttribute.replace('_modifier', '');
                if (saveAbility === changedAttribute) {
                    log(`${save} Save Watch Detected Attribute Modifier Change That Affects Save`, eventInfo.sourceAttribute, r20color);
                    //if it is, update the save with the new modifier value
                    newCalcNeeded = true;
                }
                else {
                    log(`${save} Save Watch Detected Attribute Modifier Change That Does Not Affect Save`, eventInfo.sourceAttribute, r20color);
                    return; // exit early if the changed attribute does not affect this save
                }
            }
            // Do The Calculations
            //Fields for Level or Armor
            const level = parseInt(v.level) || 0;
            const armorFortDefense = parseInt(v.armor_fort_defense) || 0;
            const armorLevel = parseInt(v.armor_level) || 0;
            const armorWillDefense = parseInt(v.armor_will_defense) || 0;
            const armorWorn = parseInt(v.armor_worn) || 0;
            const armorProficientMultiplier = (parseInt(v.armor_proficient_multiplier) || 0) ^ 1; // if proficient multiplier is 0, treat it as 1, if it's 1, treat it as 0, since a proficient multiplier of 1 means you take the full penalty, while a proficient multiplier of 0 means you ignore the penalty
            const shieldProficientMultiplier = (parseInt(v.shield_proficient_multiplier) || 0) ^ 1; // if proficient multiplier is 0, treat it as 1, if it's 1, treat it as 0, since a proficient multiplier of 1 means you take the full penalty, while a proficient multiplier of 0 means you ignore the penalty
            const shieldLevel = parseInt(v.shield_level) || 0;
            const shieldWillDefense = parseInt(v.shield_will_defense) || 0;
            const shieldFortDefense = parseInt(v.shield_fort_defense) || 0;
            const shieldWorn = parseInt(v.shield_worn) || 0;
            //Field for Class Bonus
            const classBonus = parseInt(v[`${save}_class_bonus`]) || 0;
            //Fields for Ability Modifier            
            const abilityModifier = v[`${save}_ability_modifier`] || ''; // What the modifier value gets placed into
            const abilityModSelected = v[`${save}_ability_mod`] || ''; // What the dropdown for ability mod is set to
            const strengthMod = parseInt(v.strength_modifier) || 0;
            const dexterityMod = parseInt(v.dexterity_modifier) || 0;
            const cappedDexMod = parseInt(v.capped_dex_mod) || 0;
            const constitutionMod = parseInt(v.constitution_modifier) || 0;
            const intelligenceMod = parseInt(v.intelligence_modifier) || 0;
            const wisdomMod = parseInt(v.wisdom_modifier) || 0;
            const charismaMod = parseInt(v.charisma_modifier) || 0;
            //Field for Misc Mod
            const miscSaveMod = parseInt(v[`${save}_misc_save_mod`]) || 0;
            const abilityMod = parseInt(v[`${save}_ability_mod`]) || 0;
            //Condition
            const conditionMod = parseInt(v.condition) || 0;
            //prep for updates
            const setAttrsObj = {};
            setAttrsObj[`${save}_misc_save_mod`] = miscSaveMod; // ensure misc mod is included in updates even if it didn't trigger the change
            setAttrsObj[`${save}_class_bonus`] = classBonus; // ensure class bonus is included in updates even if it didn't trigger the change
            let levelOrArmorBonus, abilityModValue;
            //determine which attribute modifier to use....
            switch (abilityModSelected) {
                case 'strength':
                    abilityModValue = strengthMod;
                    break;
                case 'dexterity':
                    abilityModValue = cappedDexMod === 'none' ? dexterityMod : Math.min(dexterityMod,parseInt(cappedDexMod) || 0);
                    break;
                case 'constitution':
                    abilityModValue = constitutionMod;
                    break;
                case 'intelligence':
                    abilityModValue = intelligenceMod;
                    break;
                case 'wisdom':
                    abilityModValue = wisdomMod;
                    break;
                case 'charisma':
                    abilityModValue = charismaMod;
                    break;
            }
            setAttrsObj[`${save}_ability_modifier`] = abilityModValue; // ensure ability mod is included in updates even if it didn't trigger the change
            if (armorWorn === 1 || shieldWorn === 1) {
                levelOrArmorBonus = save === 'fort' ? level + (((armorFortDefense * armorProficientMultiplier) * armorWorn) + ((shieldFortDefense * shieldProficientMultiplier) * shieldWorn)) : save === 'ref' ? Math.max(level, ((armorLevel * armorWorn) + (shieldLevel * shieldWorn))) : level + (((armorWillDefense * armorProficientMultiplier) * armorWorn) + ((shieldWillDefense * shieldProficientMultiplier) * shieldWorn));
            }
            else {
                levelOrArmorBonus = level;
            }
            setAttrsObj[`${save}_level_or_armor`] = levelOrArmorBonus; // ensure level or armor bonus is included in updates even if it didn't trigger the change
            const saveTotal = 10 + conditionMod + levelOrArmorBonus + classBonus + abilityModValue + miscSaveMod;
            setAttrsObj[`${save}_total`] = saveTotal; // ensure save total is included in updates even if it didn't trigger the change
            setAttrsObj["modified_by_condition"] = Math.abs(conditionMod) > 0 ? 1 : 0;
            setAttrs(setAttrsObj,{silent: true});
        });
    });
});








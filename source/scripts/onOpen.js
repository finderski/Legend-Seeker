function damageThreshold () {
    getAttrs(['fort_total', 'stamina_miscBonus', 'current_character_type','monster_size'], function(v) {
        const fortTotal = parseInt(v.fort_total) || 0;
        const staminaMiscBonus = parseInt(v.stamina_miscBonus) || 0;
        const sizeAdjustment = (parseInt(v.current_character_type, 10) || 1) === 4
            ? (sizeModifiers[(v.monster_size || "medium").toLowerCase()]?.damageThresholdMod || 0)
            : 0;
        const staminaDamageThreshold = fortTotal + staminaMiscBonus + sizeAdjustment;
        const setattrs = {};
        setattrs['stamina_fortDef'] = fortTotal;
        setattrs['stamina_damageThreshold'] = staminaDamageThreshold
        setAttrs(setattrs);
    });
};

function updateWeaponsBabHalfLevel() {
    getSectionIDs('repeating_weapons', function(ids) {
        getAttrs(['base_attack_bonus','half-level'], function(values) {
            // Update Weapons stuff
            ids.forEach(function(id) {
                const attrsToSet = {};
                attrsToSet[`repeating_weapons_${id}_weapon-half-level`] = values['half-level'] || 0;
                attrsToSet[`repeating_weapons_${id}_weapon-base-attack-bonus`] = values['base_attack_bonus'] || 0;
                setAttrs(attrsToSet);
            });
        });
    });
}

function compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    const len = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < len; i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;

        if (aVal < bVal) return -1;
        if (aVal > bVal) return 1;
    }

    return 0;
}

function fauxChange(field, fauxvalue) {
  //repeating  fields should be passed in the format: repeating_<section>:attributes
  //example: repeating_skills:skillnamerank
  log('FauxChange Reached: Field', field, r20color);
  log('Setting faux value(s) for', field, 'orangered');
  if (field.indexOf(':') > -1) {
    log('fauxChange', 'repeating section', '#CCCCFF');
    //console.log("Need to update values in a repeating section");
    let getfields = field.split(':');
    let repeatingSection = getfields[0];
    let repeatingField = getfields[1];
    let sattrs = {};
    getSectionIDs(repeatingSection, function (idArray) {
      if (idArray.length > 0) {
        log('IDs in Repeating Section', idArray, 'orangeread');
        let oldValues = [];
        let fieldArray = [];
        for (let a = 0; a < idArray.length; a++) {
          fieldArray[fieldArray.length] =
            repeatingSection + '_' + idArray[a] + '_' + repeatingField;
          log('Added field', fieldArray[a], 'orangered');
        }
        getAttrs(fieldArray, function (v) {
          for (let b = 0; b < idArray.length; b++) {
            oldValues[oldValues.length] = v[fieldArray[b]];
            log(`Setting Faux Value (${fieldArray[b]})`, fauxvalue, r20color);
            sattrs[fieldArray[b]] = fauxvalue;
          }
          log('Step', '!!! Setting Fake Value !!!', 'orangered');
          setAttrs(sattrs, null, () => {
            for (let c = 0; c < idArray.length; c++) {
              log(
                'Added Field',
                fieldArray[c] + ' = ' + oldValues[c],
                'orangered'
              );
              log(
                `Setting Previous Value (${fieldArray[c]})`,
                oldValues[c],
                r20color
              );
              sattrs[fieldArray[c]] = oldValues[c];
            }
            log('Step', '!!! Setting Real Values !!!', 'orangered');
            setAttrs(sattrs);
          });
        });
      }
    });
  } else {
    //console.log("Updating values in a Non-Repeating Section");
    log('fauxChange', 'Not Repeating Section', '#CCCCFF');
    getAttrs([field], function (v) {
      let prevValue = v[field];
      let sattrs = {};
      //console.log(`++++ Setting ${field} to ${fauxvalue} ++++`);
      //console.log("Setting " + field + " to " + fauxvalue);
      sattrs[field] = fauxvalue;
      log(`Setting Faux Value (${field})`, fauxvalue, r20color);
      setAttrs(sattrs, null, () => {
        sattrs[field] = prevValue;
        log(`Setting Previous Value (${field})`, prevValue, r20color);
        setAttrs(sattrs);
      });
    });
  }
}

const sheetVersionFields = ['sheetversion','shield_dr','armor_dr','level','armor_worn','base_attack_bonus','current_character_type'];
sheetVersionFields.push(...listOfAttributes);

on('sheet:opened', function() {
    getAttrs(sheetVersionFields, function(values) {
        const currentVersion = '0.3.1';
        const sheetVersion = values.sheetversion || '0.0.0';
        const shield_dr = parseInt(values.shield_dr) || 0;
        const armor_dr = parseInt(values.armor_dr) || 0;
        const level = parseInt(values.level) || 1;
        const bab = parseInt(values.base_attack_bonus) || 0;
        const currStr = parseInt(values.strength) || 0;
        const currDex = parseInt(values.dexterity) || 0;
        const currCon = parseInt(values.constitution) || 0;
        const currInt = parseInt(values.intelligence) || 0;
        const currWis = parseInt(values.wisdom) || 0;
        const currCha = parseInt(values.charisma) || 0; 
        const currentCharacterType = parseInt(values.current_character_type, 10) || 1;

        log("Sheet Version", sheetVersion, r20color);
        log("Current Version", currentVersion, r20color);
        log("Comparing Versions", `compareVersions(sheetVersion, currentVersion) = ${compareVersions(sheetVersion, currentVersion)}`, r20color);
        // Check if sheetversion is less than 0.1.1, if so, update the weapon attributes. This ensures that we don't overwrite any existing values for current users, but new users will have the correct attributes from the start.
        if (compareVersions(sheetVersion, '0.1.1') < 0) {
            log('Updates for version 0.1.1', "update total_dr", r20color);
            const setattrs = {};
            setattrs['total_dr'] = shield_dr + armor_dr;
            setAttrs(setattrs);
        }
        log("version 0.1.1 update check complete", "No further updates needed for version 0.1.1", r20color);
        if (compareVersions(sheetVersion, '0.1.2') < 0) {
            log('Updates for version 0.1.2', "Update Base Attack Bonus to replace HPB", r20color);
            const bab = level < 5 ? 2 : level < 9 ? 3 : level < 13 ? 4 : level < 17 ? 5 : 6;
            setAttrs({ "base_attack_bonus": bab });
        }
        log("version 0.1.2 update check complete", "No further updates needed for version 0.1.2", r20color);
        if (compareVersions(sheetVersion, '0.1.3') < 0) {
            log('Updates for version 0.1.3', "update the Lore skills with the ability modifiers", r20color);
            const loreSkills = ['lore-arcana', 'lore-architecture', 'lore-dungeoneering', 'lore-geography', 'lore-history', 'lore-keepers', 'lore-nature', 'lore-nobility', 'lore-planes', 'lore-religion', 'lore-streetwise'];
            loreSkills.forEach(skill => { recalcSkill(skill); });
        }
        log("version 0.1.3 update check complete", "No further updates needed for version 0.1.3", r20color);
        if(compareVersions(sheetVersion, '0.2.0') < 0) {
            log('Updates for version 0.2.0', "update skill linked attributes and formulas and defense Save Calculations", r20color);
            const skillList = [['acrobatics','dexterity'],['climb', 'strength'],['craft', 'wisdom'],['deception', 'charisma'],  ['endurance', 'constitution'],['gather-information','charisma'],['initiative','dexterity'],['invoke-arcana','intelligence'],['jump','strength'],['lore-arcana','intelligence'],['lore-architecture','intelligence'],['lore-dungeoneering','intelligence'],['lore-geography','intelligence'],['lore-history','intelligence'],['lore-keepers','intelligence'],['lore-nature','intelligence'],['lore-nobility','intelligence'],['lore-planes','intelligence'],['lore-religion','intelligence'],['lore-streetwise','intelligence'],['notice','wisdom'],['persuasion','charisma'],['ride','dexterity'],['sense-motive','wisdom'],['stealth','dexterity'],['survival','wisdom'],['swim','strength'],['tinkering','intelligence'],['treat-wounds','wisdom']];
            const setattrs = {};
            skillList.forEach(([skill, attribute]) => {
                setattrs[`${skill}_ability`] = `@{${attribute}}`;
            });
            setAttrs(setattrs);
            log("version 0.2.0 update check complete", "No further updates needed for version 0.2.0", r20color);
            skillList.forEach(([skill]) => { recalcSkill(skill); });
            //force Defense Saves to recalculate
            log("Forcing defense saves to recalculate with new formulas", "Triggering changes to level to force recalculation", r20color);
            setAttrs({level: level + 1}); // since the save calculations depend on level, we can just trigger a change to level to force them to recalculate with the new formulas
            setAttrs({level: level - 1}); // set level back to its original value after triggering the change
            log("Damage Reduction recalculation", "DR to recalculate with new formulas", r20color);
            calculateDR();
        }
        if(compareVersions(sheetVersion, currentVersion) < 0) {
            log('updates for version 0.2.1', "Fix Armor Check Penalty", r20color);
            //toggle Armor Worn to force a calculation update
            let armorWorn = (parseInt(values.armor_worn) || 0) ^ 1;
            setAttrs({armor_worn: armorWorn});
            armorWorn ^= 1; // toggle it back to its original value
            setAttrs({armor_worn: armorWorn});
            const setattrs = {};
            setattrs['sheetversion'] = currentVersion;
            setAttrs(setattrs);
            log("version 0.2.1 update complete", "Sheet version updated to 0.2.1 and Armor Check Penalty should now be fixed", r20color);
        } 
        if(compareVersions(sheetVersion, currentVersion) < 0) {
            log('updates for version 0.2.2', "Defense Score Calcs and Add Double Crit", r20color);
            //force Defense Saves to recalculate
            log("Forcing defense saves to recalculate with new formulas", "Triggering changes to level to force recalculation", r20color);
            setAttrs({"level": level + 1}); // since the save calculations depend on level, we can just trigger a change to level to force them to recalculate with the new formulas
            setAttrs({"level": level - 1}); // set level back to its original value after triggering the change
            log("Double Crit Eligibility", "Force BAB Change and revert", r20color);
            setAttrs({"base_attack_bonus": bab + 1});
            setAttrs({"base_attack_bonus": bab - 1});
            const setattrs = {};
            setattrs['sheetversion'] = currentVersion;
            setAttrs(setattrs);
            log("version 0.2.2 update complete", "Sheet version updated to 0.2.2 and Defense Score Calcs and Double Crit should now be fixed", r20color);
        }
        if(compareVersions(sheetVersion, currentVersion) < 0) {
            log('updates for version 0.2.3', "Fix Stealth Skill Calculation", r20color);
            listOfSklls.forEach(skill => { recalcSkill(skill); });
            const setattrs = {};
            setattrs['sheetversion'] = currentVersion;
            setAttrs(setattrs);
            log("version 0.2.3 update complete", "Sheet version updated to 0.2.3 and Stealth Skill Calculation should now be fixed", r20color);
        }
        if(compareVersions(sheetVersion, currentVersion) < 0) {
            log('updates for version 0.3.0', "Recalculate Encumbrance State", r20color);
            recalculateAllWeightTotals(function () {
                calculateEncumbrance(function () {
                    setAttrs({ sheetversion: currentVersion });
                    log("version 0.3.0 update complete", "Sheet version updated to 0.3.0 and encumbrance state recalculated", r20color);
                });
            });
        }
        if(compareVersions(sheetVersion, currentVersion) < 0) {
            log('updates for version 0.3.1', "Make sure Flat-Footed Save is Calculated", r20color);
            getAttrs(['level'], function(character) {
                const currentLevel = parseInt(character.level) || 0;
                fauxChange('level', currentLevel + 1, function() {
                    setAttrs({ sheetversion: currentVersion });
                    log("version 0.3.1 update complete", "Sheet version updated to 0.3.1 and Flat-Footed Save calculation should now be fixed", r20color);
                });
            });
        }
        else {
            log('Sheet version is up to date', "No updates needed", r20color);
        }
    });
});

// Need to make sure that every weapon has the half level and heroic proficiency attributes, even if they aren't used, so that the calculations for those attributes work properly.
on('sheet:opened', function() {
    log('Sheet Opened',"Updating weapon attributes to ensure calculations work", r20color);
    damageThreshold();
    updateWeaponsBabHalfLevel();
    /*
    getSectionIDs('repeating_weapons', function(ids) {
        getAttrs(['base_attack_bonus','half-level'], function(values) {
            // Update Weapons stuff
            ids.forEach(function(id) {
                const attrsToSet = {};
                attrsToSet[`repeating_weapons_${id}_weapon-half-level`] = values['half-level'] || 0;
                attrsToSet[`repeating_weapons_${id}_weapon-base-attack-bonus`] = values['base_attack_bonus'] || 0;
                setAttrs(attrsToSet);
            });
        });
    });
    */
});

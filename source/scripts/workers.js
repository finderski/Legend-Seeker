
// Define colors for Logs
const r20color = '#E948C9';
const buttonClick = 'goldenrod';
const sheetinit = 'lime';
const deltaColor = 'darkgoldenrod';
const derivedStatsColor = 'Salmon';

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
    return dicePattern.test(expression);
}

const coreAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];

coreAttributes.forEach(attribute => {
    on(`change:${attribute}`, function (eventInfo) {
        const attScore = Math.floor((parseInt(eventInfo.newValue) || 0));
        let modScore;
        switch(attScore) {
            case 3:
                modScore = -4;
                break;
            case 4:
            case 5:
                modScore = -3;
                break;
            case 6:
            case 7:
                modScore = -2;
                break;
            case 8:
            case 9:
                modScore = -1;
                break;
            case 10:
            case 11:
                modScore = 0;
                break;
            case 12:
            case 13:
                modScore = 1;
                break;
            case 14:
            case 15:
                modScore = 2;
                break;
            case 16:
            case 17:
                modScore = 3;
                break;
            case 18:
            case 19:
                modScore = 4;
                break;
            default:
                modScore = 5;
                break;
        }
        log("Modifier", modScore, derivedStatsColor)
        const attrsToSet = {};
        attrsToSet[`${attribute}_modifier`] = modScore;
        setAttrs(attrsToSet);
    });
});

// Update Corruption
on('change:wisdom', function(eventInfo) {
    const wisdomScore = Math.floor((parseInt(eventInfo.newValue) || 0));
    const setattrs = {};
    for(let i=1; i <= 24; i++) {
        // while i is the less than 24, hide the lock inputs
        if (i <= wisdomScore) {
            setattrs[`corruption_lock_${i}`] = 'show';
        } else {
            setattrs[`corruption_lock_${i}`] = 'hide';
        }
    }
    setAttrs(setattrs);
});

// Watch for changes for Stamina Damage Threshold
on('change:stamina_fortdef change:stamina_miscbonus', function(eventInfo) {
    log("Threshold Watch Detected Change", eventInfo, r20color);
    getAttrs(['stamina_fortDef', 'stamina_miscBonus'], function(v) {
        const fortTotal = parseInt(v.stamina_fortDef) || 0;
        const staminaMiscBonus = parseInt(v.stamina_miscBonus) || 0;
        const staminaDamageThreshold = fortTotal + staminaMiscBonus;
        setAttrs({ "stamina_damageThreshold": staminaDamageThreshold });
    });
});

// Watch for Changes to Condition to update Styling.
on('change:condition', function(eventInfo) {
    const conditionValue = eventInfo.newValue;
    const setattrs = {};
    setattrs['condition_selected'] = conditionValue;
    setAttrs(setattrs);
});

// Watch for Fort Save Changes
on('change:level_or_armor change:class_bonus change:constitution_modifier change:fort_misc_save_mod', function() {
    getAttrs(['level_or_armor', 'class_bonus', 'constitution_modifier', 'FORT_misc_save_mod'], function(v) {
        console.log("v ", v);
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.class_bonus) || 0;
        const constitutionModifier = parseInt(v.constitution_modifier) || 0;
        const fortMiscSaveMod = parseInt(v.FORT_misc_save_mod) || 0;
        log("Fort Save Calculation", `10 + ${levelOrArmor} (Level/Armor) + ${classBonus} (Class Bonus) + ${constitutionModifier} (Constitution Modifier) + ${fortMiscSaveMod} (Misc Mod)`, r20color);
        const fortSaveTotal = 10+levelOrArmor + classBonus + constitutionModifier + fortMiscSaveMod;
        const setattrs = {};
        setattrs['FORT_total'] = fortSaveTotal;
        setattrs['stamina_fortDef'] = fortSaveTotal;
        setAttrs(setattrs);
    });
});

// Watch for Ref Save Changes
on('change:level_or_armor change:class_bonus change:dexterity_modifier change:ref_misc_save_mod', function() {
    getAttrs(['level_or_armor', 'class_bonus', 'dexterity_modifier', 'REF_misc_save_mod'], function(v) {
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.class_bonus) || 0;
        const dexterityModifier = parseInt(v.dexterity_modifier) || 0;
        const refMiscSaveMod = parseInt(v.REF_misc_save_mod) || 0;

        const refSaveTotal = 10+levelOrArmor + classBonus + dexterityModifier + refMiscSaveMod;
        setAttrs({ REF_total: refSaveTotal });
    });
});

// Watch for Will Save Changes
on('change:level_or_armor change:class_bonus change:wisdom_modifier change:will_misc_save_mod', function() {
    getAttrs(['level_or_armor', 'class_bonus', 'wisdom_modifier', 'WILL_misc_save_mod'], function(v) {
        const levelOrArmor = parseInt(v.level_or_armor) || 0;
        const classBonus = parseInt(v.class_bonus) || 0;
        const wisdomModifier = parseInt(v.wisdom_modifier) || 0;
        const willMiscSaveMod = parseInt(v.WILL_misc_save_mod) || 0;

        const willSaveTotal = 10+levelOrArmor + classBonus + wisdomModifier + willMiscSaveMod;
        setAttrs({ WILL_total: willSaveTotal });
    });
});
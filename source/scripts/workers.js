
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

const getCharismaMod = function (charismaScore, checkType) {
    //if checkType is empty, assume Reaction Check
    if (!checkType) {
        checkType = 'reaction';
    }
    //make sure charismaScore is a number
    const score = parseInt(charismaScore, 10);
    if (isNaN(score)) {
        return 0;
    }
    switch (score) {
        case 3:
            return -3;
        case 4:
            if (checkType !== 'reaction') {
                return -3;
            } else {
                return -2;
            }
            break;
        case 5:
            return -2;
        case 6:
            if (checkType !== 'reaction') {
                return -2;
            } else {
                return -1;
            }
            break;
        case 7:
            return -1;
        case 8:
            if (checkType !== 'reaction') {
                return -1;
            } else {
                return 0;
            }
            break;
        case 9:
        case 10:
        case 11:
        case 12:
            return 0;
        case 13:
            if (checkType !== 'reaction') {
                return 0;
            } else {
                return +1;
            }
            break;
        case 14:
            return +1;
        case 15:
            if (checkType !== 'reaction') {
                return +1;
            } else {
                return +2;
            }
            break;
        case 16:
            return +2;
        case 17:
            if (checkType !== 'reaction') {
                return +2;
            } else {
                return +3;
            }
            break;
        case 18:
            return +3;
        case 19:
            if (checkType !== 'reaction') {
                return +3;
            } else {
                return +4;
            }
            break;
        case 20:
            return +4;
        default:
            if (checkType !== 'reaction') {
                return +4;
            } else {
                return +5;
            }
    }
}

on('change:base_armor change:armor_ac', function () {
    log('Armor Change Detected', "AC was entered", "darkblue");
    getAttrs(['base_armor', 'armor_ac'], function (values) {
        const baseArmor = parseInt(values['base_armor']) || 0;
        const armorAC = parseInt(values['armor_ac']) || 0;
        // determine which is lower and use that as the AC
        let useAC = baseArmor < armorAC ? baseArmor : armorAC;
        if (useAC < 1 || useAC > 10) { useAC = useAC < 1 ? 1 : 10; }
        setAttrs({ acMutant: useAC });
    });
});
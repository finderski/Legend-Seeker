// Define colors for Logs
const r20color = '#E948C9';
const buttonClick = 'goldenrod';
const sheetinit = 'lime';
const deltaColor = 'darkgoldenrod';
const derivedStatsColor = 'Salmon';

// Core Attributes
const coreAttributes = ['strength', 'dexterity', 'constitution', 'intelligence', 'wisdom', 'charisma'];
const listOfAttributes = ['strength_modifier', 'dexterity_modifier', 'constitution_modifier', 'intelligence_modifier', 'wisdom_modifier', 'charisma_modifier'];
const adjustedAttributes = ['strength_adjusted', 'dexterity_adjusted', 'constitution_adjusted', 'intelligence_adjusted', 'wisdom_adjusted', 'charisma_adjusted'];

// List of all skills
const listOfSklls = ['acrobatics','climb','craft','deception','endurance','gather-information','initiative','invoke-arcana','jump','lore-arcana','lore-architecture','lore-dungeoneering','lore-geography','lore-history','lore-keepers','lore-nature','lore-nobility','lore-planes','lore-religion','lore-streetwise','notice','persuasion','ride','sense-motive','stealth','survival','swim','tinkering','treat-wounds','mana-tap'];

// For Weapons
const damageFields = ["repeating_weapons_weapon-half-level", "repeating_weapons_weapon-damage-dice", "repeating_weapons_weapon-damage-attribute-mod", "repeating_weapons_damage-attribute-mod-value", "repeating_weapons_weapon-damage-misc-mod"];
const atkFields = ["repeating_weapons_weapon-base-attack-bonus", "repeating_weapons_weapon-atk-bonus", "repeating_weapons_weapon-misc-mod"];

// Size Modifiers
const sizeModifiers = {
    fine: {
        label: "Fine",
        attributeMods: {
            strengthMod: -8,
            constitutionMod: 0,
            dexterityMod: 8,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: 10,
        stealthMod: 20,
        damageThresholdMod: 0,
        carryingCapacityMultiplier: 0.1,
        heightLength: "0.1 m or less"
    },
    diminutive: {
        label: "Diminutive",
        attributeMods: {
            strengthMod: -6,
            constitutionMod: 0,
            dexterityMod: 6,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: 5,
        stealthMod: 15,
        damageThresholdMod: 0,
        carryingCapacityMultiplier: 0.25,
        heightLength: "0.2-0.3 m"
    },
    tiny: {
        label: "Tiny",
        attributeMods: {
            strengthMod: -4,
            constitutionMod: 0,
            dexterityMod: 4,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: 2,
        stealthMod: 10,
        damageThresholdMod: 0,
        carryingCapacityMultiplier: 0.5,
        heightLength: "0.4-0.6 m"
    },
    small: {
        label: "Small",
        attributeMods: {
            strengthMod: -2,
            constitutionMod: 0,
            dexterityMod: 2,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: 1,
        stealthMod: 5,
        damageThresholdMod: 0,
        carryingCapacityMultiplier: 0.75,
        heightLength: "0.7-1.2 m"
    },
    medium: {
        label: "Medium",
        attributeMods: {
            strengthMod: 0,
            constitutionMod: 0,
            dexterityMod: 0,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: 0,
        stealthMod: 0,
        damageThresholdMod: 0,
        carryingCapacityMultiplier: 1,
        heightLength: "1.3-2.4 m"
    },
    large: {
        label: "Large",
        attributeMods: {
            strengthMod: 8,
            constitutionMod: 8,
            dexterityMod: -2,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: -1,
        stealthMod: -5,
        damageThresholdMod: 5,
        carryingCapacityMultiplier: 2,
        heightLength: "2.5-4.8 m"
    },
    huge: {
        label: "Huge",
        attributeMods: {
            strengthMod: 16,
            constitutionMod: 16,
            dexterityMod: -4,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: -2,
        stealthMod: -10,
        damageThresholdMod: 10,
        carryingCapacityMultiplier: 5,
        heightLength: "4.9-9.6 m"
    },
    gargantuan: {
        label: "Gargantuan",
        attributeMods: {
            strengthMod: 24,
            constitutionMod: 24,
            dexterityMod: -4,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: -5,
        stealthMod: -15,
        damageThresholdMod: 20,
        carryingCapacityMultiplier: 10,
        heightLength: "9.7-19.2 m"
    },
    colossal: {
        label: "Colossal",
        attributeMods: {
            strengthMod: 32,
            constitutionMod: 32,
            dexterityMod: -4,
            intelligenceMod: 0,
            wisdomMod: 0,
            charismaMod: 0
        },
        defenseMod: -10,
        stealthMod: -20,
        damageThresholdMod: 50,
        carryingCapacityMultiplier: 20,
        heightLength: "19.3 m+"
    }
};

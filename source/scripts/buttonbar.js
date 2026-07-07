/* ---- Button Bar Clicks ---- */
const buttonlist = [
    'frontsheet_1',
    'backsheet_2',
    'settings_3',
    'monster_4'
];

buttonlist.forEach(button => {
    on(`clicked:${button}`, function () {
        let setattr = {};
        log('Button Bar Button', `${button} button was clicked!!`, buttonClick);
        let radioval = `${button}`;
        //radioval = radioval.slice(-1);
        radioval = radioval.split('_');
        setattr['sheetTab'] = radioval[1];
        if(radioval[1] === '1' || radioval[1] === '4') {
            setattr['current_character_type'] = radioval[1];
        }
        
        setAttrs(setattr);
    });
});
/* ---- Button Bar Clicks ---- */
const buttonlist = [
    'frontsheet_1',
    'backsheet_2',
    'settings_3',
    'concise_4'
];

buttonlist.forEach(button => {
    on(`clicked:${button}`, function () {

        let setattr = {};
        log('Button Bar Button', `${button} button was clicked!!`, buttonClick);
        let radioval = `${button}`;
        //radioval = radioval.slice(-1);
        radioval = radioval.split('_');
        setattr['sheetTab'] = radioval[1];
        setAttrs(setattr);
    });
});
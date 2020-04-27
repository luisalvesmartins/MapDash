var Forms={
    create:function(form){
        var sHTML="";
        form.fields.forEach(f => {
            sHTML+="<div>" + f.title + "</div><div>";
            switch (f.type) {
                case 'date':
                    sHTML+="<input id='form_" + f.id + "'>";

                    break;
                case 'list':
                    sHTML+="<select id='form_" + f.id + "'>";
                    for(let o in f.data)
                    {
                        sHTML+="<option value='" + o + "'>" + f.data[o] + "</div>";
                    }
                    sHTML+="</select>";
                
                    break;
                case 'text':
                    sHTML+="<input id='form_" + f.id + "'>";
                
                    break;
                    
                default:
                    sHTML+="<input id='form_" + f.id + "'>";
            }
            sHTML+="</div>";
        });
        return sHTML;
    },
    afterRender:function(form){
        form.fields.forEach(f => {
            sHTML+="<div>" + f.title + "</div><div>";
            switch (f.type) {
                case 'date':
                    var a=new Pikaday({
                        field: document.getElementById('form_' + f.id),
                        firstDay: 1,
                        minDate: new Date(2016, 0, 1),
                        maxDate: new Date(2100, 12, 31),
                        yearRange: [2016,2100],
                        showTime: false,
                        autoClose: true,
                        use24hour: false,
                        format: 'YYYY/MM/DD'
                    });
                    break;
                default:
                    break;
            }
        });
    },
    getFields:function(form){
        var results=[];
        form.fields.forEach(f => {
            results.push({
                field:f.id,
                value:document.getElementById('form_' + f.id).value
            })
        });
        return results;
    }
}
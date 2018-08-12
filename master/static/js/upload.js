

document.getElementById("csvfile").addEventListener("change", function(){
    const uploadedFile = this.files[0];
    const fileReader = new FileReader();

    document.getElementById("csvfile-name").innerHTML = uploadedFile.name;

    fileReader.readAsText(uploadedFile, 'UTF-8');
    fileReader.addEventListener("loadend", function(){
        const header = fileReader.result.split(/\r/g)[0];
        columns = header.split(";");
        console.log(columns);
        data = {};

        function stringifyData(){
            $("#json").val(JSON.stringify(data));
        }

        titleField = `<div class="mdl-textfield mdl-js-textfield">
            <input class="mdl-textfield__input" type="text" id="titlefield">
            <label class="mdl-textfield__label" for="titlefield">Title of dataset</label>
          </div>`;

        dataSetupDiv = $("#dataSetup");
        dataSetupDiv.append(titleField);

        $("#titlefield").change(function(){
            data["title"] = $(this).val();
            stringifyData();
        });

        columns.forEach(function(column){
            column = column.toLowerCase();
            if(column.indexOf("_attr") > -1){
                data[column] = {"visualize": true, "numerical": false};

                visualizeField = `<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${column}-visualize">
                  <input type="checkbox" id="switch-${column}-visualize" class="mdl-switch__input" checked>
                  <span class="mdl-switch__label">Visualize ${column}?</span>
                </label>`;

                dataSetupDiv.append(visualizeField);

                $(`#switch-${column}-visualize`).change(function(){
                    data[column]["visualize"] = this.checked;
                    stringifyData();
                });

                numericalField = `<label class="mdl-switch mdl-js-switch mdl-js-ripple-effect" for="switch-${column}-numerical">
                  <input type="checkbox" id="switch-${column}-numerical" class="mdl-switch__input">
                  <span class="mdl-switch__label">${column} numerical?</span>
                </label>`;

                dataSetupDiv.append(numericalField);

                $(`#switch-${column}-numerical`).change(function(){
                    data[column]["numerical"] = this.checked;
                    if(this.checked){
                        $(`#bins-${column}`).show();
                    } else{
                        $(`#bins-${column}`).hide();
                    }
                    stringifyData();
                });

                binsField = `<div class="mdl-textfield mdl-js-textfield">
                    <input class="mdl-textfield__input" type="text" id="bins-${column}">
                    <label class="mdl-textfield__label" for="bins-${column}">Number of bins</label>
                  </div>`;

                dataSetupDiv.append(binsField);
                $(`#bins-${column}`).hide();

                $(`#bins-${column}`).change(function(){
                    data[column]["bins"] = $(this).val();
                    stringifyData();
                });
            }

            if(column.indexOf("_temp") > -1){
                data[column] = {"temporal": true}
                stringifyData();
                dataSetupDiv.append(`<hr><br>${column} is the temporal attribute. Do realize this attribute cannot be numeric!
                    The timeline will be sorted STRING-wise. Hence if numbers, provide leading zeros in CSV file.
                    Namely a list of values ['2', '12'] will be sorted as ['12', '2']. Instead use ['02', '12'].
                    Dates should be printed in UTC format, since this is perfect for sorting. YYYY-MM-DD. Or YYYY-MM.<hr>`);
            }
        });

        componentHandler.upgradeDom();
        stringifyData();
    });
});
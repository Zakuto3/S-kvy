$(function () {
	$.ajax({
		type: 'GET',
		url: 'http://localhost:1337/geoportia',
		success: function (lagerspecar) {
			lagerspecar.forEach(function (v) {
				var opt = document.createElement('option');
				opt.textContent = v.name;
				opt.value = v.name + "|" + v.public_title + "|" + v.postgis_table_name + "|" + v.postgis_view_where_condition;
				$("#layerspecs").append(opt);
			});
		}
	});
});

//fill dropbox with table column names from the database
function fillDropBox(kolumner){
	$(".dropbox_option").remove();
	kolumner.forEach(function (kolumn) {
		var option = document.createElement('option');
		option.className = "dropbox_option";
		option.textContent = kolumn.column_name;
		$(".dropbox").append(option);
		});
};		
				
//creates a string which you can insert in the html to create a  new row
function createRow(){
	var row = "<tr>";
	var removeButton = "<td><button type='button' class='btn btn-danger' name='bortknapp' data-toggle='tooltip' title='Ta bort denna rad'>X</button></td>";
	var columnName = "<td><select class='dropbox' id='kolumn' name='kolumn'></select></td>";
	var titleBox = "<td><input onchange='checkbox(this)' type='checkbox' id='title' class='title_check' data-toggle='tooltip' title='Det här kolumnnamnet blir titel för nya sökvyn.' ></td>";
	var searchBox = "<td><input type='checkbox' id='sokdel' name='checkbox' data-toggle='tooltip' title='För att göra kolumnen sökbar klickar du i bockrutan'></td>";
	var FTLfield = "<td><input id='FTLfield' type='text'data-toggle='tooltip' title='Om du vill använda FTL-vy så ange ett användarvänligt namn här, annars lämna det tomt'></td>"
	var FTLtype = "<td><div class='dropdown'><button onclick='FTLtypes(this)' id='FTLtype' class='FTLtypeBtn dropbtn' data-toggle='tooltip' title='Ange FTL-namn för att välja hur värdet ska visas i FTL' disabled>Värde</button><div id='FTLlist' class='dropdown-content'><a>Länk</a><a>Bild</a><a>Datum</a><a >Heltal</a></div> </div></td>"
	row += removeButton + columnName + titleBox + searchBox + FTLfield + FTLtype +"</tr>";
	return row;


};

//onclick event in the html
//unchecks all title-checkboxes except for the one you click.
function checkbox(title){
	$('input[id="' + title.id + '"]').not(title).prop('checked', false);
}
	
function update_fixed_fields(array) {
    //document.getElementById("tabell").innerHTML=array[2];
    $('#sokvy').text(array[0]);
	$('#newsokvy').val(array[0]);
    $('#titel').text(array[1]);
	$('#newtitel').val(array[1]);	
    $('#tabell').text(array[2]);
    if (array[3] != 'null') {
        $('#where').text(array[3]);
    } else { $('#where').text("") };
};

//reads the current table from the database to get the columns
function readTableColumns(){
	var layerspecs = document.getElementById("layerspecs");
	var split = layerspecs.value.split("|");
	update_fixed_fields(split);
	$.ajax({
        type: 'GET',
        url: 'http://localhost:1337/eskilstuna/' + $('#tabell').text(),
        success: function (json) {
            fillDropBox(json);	//use the columns to fill/update the dropbox
			//updateAllDropboxes();
        }
	})
}
//allows for selection in search dropdown
$("#layerspecs").keyup(function( event ) {
	if(event.key == "Enter")
	this.size = 1;
});

//collapse the dropdown when selecting a option
$("#layerspecs").mouseup(function(){
	this.size = 1;
	$(this).trigger("change");
});

//remove all rows except the first one and update the data
$("#layerspecs").on('change', function(){
	var length = $(".dropbox").length - 1;
	$("#fler_kolumner tr:gt(1)").remove();
	readTableColumns();
	$("#sendbutton").prop('disabled', 'true');
});

//reads columns from database and updates the whole table
$(".add-all-columns").on('click', function(){
	var options = $(".dropbox:first option").length;
	var dropboxes = $(".dropbox").length;
	var boxesToAdd = options - dropboxes;
	for(var i = 0; i < boxesToAdd; i++){
			$("table").append(createRow());
			updateNewDropbox();
	};
	$("#sendbutton").prop('disabled', 'true');	
});

/*copies data from the row above and
	sets dropbox default value to whatever
	its index is, same as updateAllDropboxes
	but for +1 clickevent*/
function updateNewDropbox(){
	var index = $(".dropbox").length - 1;
	var newDropBox = $("table").find("select:last");
	$("#kolumn:first option").each(function(){
		var opt = document.createElement('option');
		opt.textContent = this.text;
		opt.className = "dropbox_option";
		newDropBox.append(opt);
	})
	var options = newDropBox.children();
	if(options.length > index){
		newDropBox.val(options[index].text);
	}
}
	
/*adds a new row when clicking on +1*/
$("#addbutton").click(function () {
	$("table").append(createRow()); // new createRow func
	updateNewDropbox();	//update the new dropbox
	$("#sendbutton").prop('disabled', 'true');
});

//clickevent to remove a row
$(document).on('click', 'button.btn-danger', function () {
    var rows = $("#mainbody").children(); 
	if(rows.length > 2)
	{
		$(this).closest('tr').remove();
		$("#sendbutton").prop('disabled', 'true');
	}
});

/*reads row and sends a object with
	information to serverside which
	returns an sqlQuery*/
$("#calcbutton").click(function () {
    var samling = {}; //tabellobjekt
    var title_is_present = false;
    $('#fler_kolumner tr').each(function (k) {// 'table row'
        var obj = {};
        $(this).find("input,select").each(function (i) {
			if (this.id.indexOf('sokdel') >= 0) {
				if ($(this).is(":checked")) 
				{
					obj["sokdel"] = "j";
				}
				else 
				{
					obj["sokdel"] = "n";
				}
			}
			if (this.id.indexOf('title') >= 0) 
			{
				if($(this).is(":checked"))
				{
					title_is_present = true;
					obj["title"] = "j";
				}
				else
				{
					obj["title"] = "n";
				}
			}
			if(this.id.indexOf('kolumn') >= 0)
			{
				obj["kolumn"] = $(this).val();
			}
		});
	samling["row" + k] = obj;
	});
	if (!title_is_present) 
	{
		alert("Måste ange en title");
		return;
	}
	else 
	{
	samling["tabellnamn"] = $('#tabell').text();
	samling["sokvynamn"] = $('#sokvy').text();
	samling["titel"] = $('#titel').text();
	samling["where"] = $('#where').text();
	$('#sql').html("<code class='code_snippets' id='SQL'>" + SQLBuilder(samling) + "</code>");
	$('#sendbutton').prop("disabled", false);
	}
});

//trigger FTLfunctions on click	
$("#calcFTL").click(calcFTL);
$("#saveFTL").click(saveFTL);

/*calculates which columns to be included in FTL
	and show the completed FTLtext on screen*/
function calcFTL (){
	var FTLnamn = [];
	var kolumnNamn = [];
	var FTLtypes = [];
	$('#fler_kolumner tr').each(function (k) {// 'table row'
		$(this).find("input,select, button").each(function (i) {
			console.log(this.id.indexOf('title'),this,this.checked);
			if (this.id.indexOf('FTLfield') >= 0) {
				FTLnamn[k] = $(this).val();
			}
			if (this.id.indexOf('kolumn') >= 0){
				kolumnNamn[k] = $(this).val();
			}
			if (this.id.indexOf('title') >= 0 && this.checked){
				kolumnNamn[k] = 'title';
			}
			if (this.id.indexOf('FTLtype') >= 0){
				FTLtypes[k] = $(this).text();
			}
		});
	});
	/*send columnNames and FTLNames into FTLbuilder
		and get the completed FTLstring*/
	var FTLString = FTLbuilder(FTLnamn, kolumnNamn,FTLtypes); 
	$('#ftl').html("<textarea disabled id='textareaFTL'>"+FTLString+"</textarea>"); 
	$('#saveFTL').prop("disabled", false);
}


//builds the FTLstring and returns it(frankenstein)
function FTLbuilder(FTLarr, kolumnArr,FTLtypes){ 
	let B = { 
		 OT : "&lt;", //<
		 CT : "&gt;", //>
		 Obold : "&lt;" + "b" + "&gt;", //<b>
		 Cbold : "&lt;" + "/b" + "&gt;", //</b>
		 tab : "\t",
		 BR : "\n",
		 Otr : "\t\t\t"+"&lt;"+"tr", // /t/t/t<tr
		 Ctr : "\t\t\t"+"&lt;"+"/tr", // /t/t/t</tr
		 td : "\t\t\t\t"+"&lt;"+"td"+"&gt;", // /t/t/t/t<td>
		 OUL : "\t\t"+"&lt;"+"ul"+"&gt;"+"\n", // /t/t<ul><br>
		 CUL : "\t\t"+"&lt;"+"/ul"+"&gt;"+"\n" // /t/t</ul><br>
	};

	let FTLbegin = B.OT+"#list features as feature"+B.CT+B.BR;
	let FTLmiddle = "";
	let FTLend = B.CUL+B.tab+B.OT+"/table"+B.CT+B.BR+
					B.OT+"/#list"+B.CT;	
	FTLbegin += B.tab+B.OT+'table class="featureInfo"'+B.CT+B.BR+B.OUL;

	for(amount in kolumnArr)
	{
		if(FTLarr[amount] != "") //check if FTLfield was empty
			FTLmiddle += BuildRow(kolumnArr[amount], FTLarr[amount], FTLtypes[amount],B);
	}
	return FTLbegin + FTLmiddle+FTLend;
};

//Builds a row in FTL based on the type chosen
function BuildRow(kolumn, name, type, B){
	let FTLrow;
	name = charConverter(name);
		switch(type){
			case "Länk": 
				FTLrow = B.Otr+B.CT+B.BR+B.td+B.OT+"a href='${feature."+kolumn+".value}' target='_blank'"+B.CT+name+B.OT+"/a"+B.CT+B.OT+"/td"+B.CT+B.BR+
				B.Ctr+B.CT+B.BR;
				 break;

			case "Datum":
				FTLrow = B.Otr+B.CT+B.BR+
				"\t\t\t\t<#assign x=feature."+kolumn+".value?index_of(' ')>"+B.BR+
				B.td+B.Obold+name+":"+B.Cbold+B.OT+"/td"+B.CT+B.BR+
				B.td+"${feature."+kolumn+".value?string?substring(0,x)}"+B.OT+"/td"+B.CT+B.BR+
				B.Ctr+B.CT+B.BR;
				break;

			case "Bild":
				FTLrow = B.Otr+B.CT+B.BR+B.td+B.OT+"img src='${feature."+kolumn+".value}' width='130px'"+B.CT+B.OT+"/td"+B.CT+B.BR+
				B.Ctr+B.CT+B.BR;
				break;

			case "Heltal":
				FTLrow = B.Otr+B.CT+B.BR+"\t\t\t\t<#assign x=feature."+kolumn+".value?index_of('.')>"+B.BR+B.td+B.Obold+name+":"+B.Cbold+B.OT+"/td"+B.CT+B.BR+
				B.td+"${feature."+kolumn+".value?string?substring(0,x)}"+B.OT+"/td"+B.CT+B.BR+
				B.Ctr+B.CT+B.BR;
				break;

			default: 
				FTLrow =  B.Otr+B.CT+B.BR+
				B.td+B.Obold+name+":"+B.Cbold+B.OT+"/td"+B.CT+B.BR+
				B.td+"${feature."+kolumn+".value}"+B.OT+"/td"+B.CT+B.BR+
				B.Ctr+B.CT+B.BR;
				 break;

		}
	return FTLrow;
}

function charConverter(str){
	//avoid translating characters in textarea
	str = str.replace(/ä/g,"&\\#228;").replace(/å/g, "&\\#229;").replace(/ö/g, "&\\#246;");
	str = str.replace(/Ä/g,"&\\#196;").replace(/Å/g, "&\\#197;").replace(/Ö/g, "&\\#214;");
	return str;
}

/*downloads the FTLstring into
	a content.ftl file*/
function saveFTL(){
	var FTLtext = $("#textareaFTL").val().replace(/\\/g, '');//Removes slashes to get correct HTML encoding in FTL file
	var file = new Blob([FTLtext]);
	var a = document.createElement("a"),
    url = URL.createObjectURL(file);
    a.href = url;
    a.download = "content.ftl";
    document.body.appendChild(a);
    a.click();
    setTimeout(function() {
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);  
    }, 0); 
}

$("#sendbutton").click(SendSQL);

//Sends query to serverside and the database
function SendSQL(){
	var SqlQuery = {};
	SqlQuery["query"] = $("#SQL").text();	
	$.post('http://localhost:1337/Core', SqlQuery, function (error) 
	{
			if(error.code == "42P07") 
			{
				if (confirm("Sökvyn med namnet finns redan, vill du ta bort och skapa ny?")) {
					SqlQuery["query"] = "DROP VIEW " + $("#sokvy").text() + "; " + SqlQuery["query"];
					$.post('http://localhost:1337/Core', SqlQuery, function(err)
					{
						if(err.code != undefined) alert("Något gick fel");
						else alert("Sökvy skapad");
					});
				}
			}
            else
			{
				alert("Sökvy skapad");
			}
    });
}

/*Toggles between text input field and paragraph
	and makes it possible to change what is in
	the paragraph*/
function changeText(button,idText,idInput){

	if(!IlligalChar($("#"+idInput).val()) && $(button).text()== "Bekräfta"){ 
		alert("Endast engelska bokstäver, siffror och understreck. Måste börja med en bokstav.");
		return;
	}

	$("#"+idInput).toggle();
	$("#"+idText).toggle();
	$("#"+idText).text($("#"+idInput).val());
	if($(button).text() == "Ändra") { $(button).text("Bekräfta"); }
	else 
	{
		$("#sendbutton").prop('disabled', 'true');
		$(button).text("Ändra");
	}
}

$("#fler_kolumner").on('change', function(){
	$("#sendbutton").prop('disabled', 'true');
	});

//regex for not allow certain characters
function IlligalChar(strToCheck){
var Regexp = /^[a-z][a-z0-9_]*$/i;//Only allows for English chars, numbers and underscore (͡°͜ʖ͡°)
return Regexp.test(strToCheck);
}

//Builds the SQL-code to send to database
function SQLBuilder (data) {

    var tabelln = data.tabellnamn;
    var sokvyn = data.sokvynamn;
    var where = data.where;
    var titel = data.titel;
    var sokbara = "";
    var sistaknamn = "";
    var skapasokvy_str = "CREATE VIEW ";
	var finnsSokBar = false;
	var finnsWhere = (where=='') ? ';':'';
    skapasokvy_str += sokvyn; 
    skapasokvy_str += " AS SELECT ";
    skapasokvy_str += '"' + tabelln + '".geom, ' + '"' + tabelln + '".geodb_oid AS sokid, ';

    function process(key, value) {
        if (key == "kolumn") 
		{
            skapasokvy_str += '"' + tabelln + '"."' + value + '"';
            sistaknamn = value;
        }
        else if (key == "title") 
		{
            if (value == "j") 
			{
				skapasokvy_str += " AS title, ";
			}
            else 
			{
                skapasokvy_str += ", "; 
            }
        }


        else if(key == "sokdel") 
        {
            if (value == "j") 
			{
                sokbara += '"' + sistaknamn +'",';
				finnsSokBar = true;
            }
        }
          
    };
    function traverse(o, func) {
        for (let i in o) {
            if (o[i] !== null && typeof (o[i]) == "object") {
                traverse(o[i], func);
            }
            else if (i == "kolumn" || i == "title" || i == "sokdel") {
                func.apply(this, [i, o[i]]); //http://www.w3schools.com/js/js_function_invocation.asp
            }
        }
    };
    traverse(data, process);
    sokbaraArray = sokbara.split(",");
    sokbaraArray.pop();	

	
	if(finnsSokBar)	
	{
		skapasokvy_str += " concat_ws(', '," + sokbaraArray + ")::text AS searchfield ";
	} 
	else
	{
		//replace "," with space for correct sql syntax
		skapasokvy_str = skapasokvy_str.substring(0,skapasokvy_str.length-2); 
		skapasokvy_str += " ";
	}	

	skapasokvy_str += "FROM " + '"' + tabelln +'" '+where + finnsWhere;
    return skapasokvy_str;
}


//filters tables when searching in searchfield
$("#Search").keyup(function searchFunc(event) {
    var filter, layerspec, options, i,laySize=0;
    filter = document.getElementById("Search").value.toUpperCase();
    layerspec = document.getElementById("layerspecs");
    options = layerspec.getElementsByTagName("option");
    for (i = 0; i < options.length; i++){
        
        if (options[i].innerHTML.toUpperCase().indexOf(filter) > -1) {
            options[i].style.display = "block";
            laySize++;
        } else {
            options[i].style.display = "none";
        }
    }   
    layerspec.size=laySize+1;
    if (event.key == "ArrowDown")
    layerspec.focus();  
    if(filter=="")
    layerspec.size=1;
});

//toggle FTLtypebuttons
function FTLtypes(thebutton) {
    $(thebutton).next().toggle();
}

//replaces buttons text with selected value in dropbox
$(document).on('click',"[id=FTLlist] a", function(){
		let button = $(this).closest("#FTLlist").siblings();
	let currentText = $(this).text();
	$(this).text(button.text());
	button.text(currentText);

});

//show or hide FTltypebutton based or FTLfield input
$(document).on('keyup',"[id=FTLfield]", function(){
	if($(this).val() == ""){
		$(this).parent().siblings().children(".dropdown").children("#FTLtype").prop('disabled', true);
	}
	else{
		$(this).parent().siblings().children(".dropdown").children("#FTLtype").prop('disabled', false);
	}
});

// Close the dropdown if the user clicks outside of it
window.onclick = function(event) {	
  if (!event.target.matches('.dropbtn')) {	
    var dropdowns = document.getElementsByClassName("dropdown-content");
    for (let i = 0; i < dropdowns.length; i++) {
      dropdowns[i].style.display = "none";     
    }
  }
}

$("#modifyFTL").click(ModFTL);

$("#calcFTL").click(CheckFTLButtons);

//button changes with FTLbutton
function CheckFTLButtons(){
	$('#saveFTL').prop("disabled", false);
	$("#calcFTL").text("Ladda om FTL");
	$("#modifyFTL").css('display', 'inline-block');
}

//hide button and enable textarea
function ModFTL(){
	$("#textareaFTL").prop('disabled',false);
	$("#modifyFTL").toggle();
}

$("#FTLcodesButton").click(function(){
	$("#FTLCodeSnippets").css("display",'block');
	$(this).toggle();
});

$("#closeFTLCode").click(function(){
	$("#FTLCodeSnippets").css("display",'none');
	$("#FTLcodesButton").toggle();
});
	
/*Function makes it possible to use tab 
	in the FTLtextarea*/
$(document).delegate('#textareaFTL', 'keydown', function(event) {
  var keyCode = event.keyCode || event.which;

  if (keyCode == 9) {
    event.preventDefault();
    var start = this.selectionStart;
    var end = this.selectionEnd;

    // set textarea value to: text before caret + tab + text after caret
    $(this).val($(this).val().substring(0, start)
                + "\t"
                + $(this).val().substring(end));

    // put caret at right position again
    this.selectionStart =
    this.selectionEnd = start + 1;
  }
});
	
$("#theme_btn").click(ChangeTheme);	

function ChangeTheme (){
	var btnValue = $("#theme_btn").val();
	switch(btnValue){
		case "Dark":
		 $("#themes").attr('href','Style/LightTheme.css');
		 $("#theme_btn").val("Light");
		break;

		case "Light":
		$("#themes").attr('href','Style/DarkTheme.css');
		$("#theme_btn").val("Dark");
		break;

	}
}

//jqueryUI för att göra lista DOMelement sorterbar
$('#fler_kolumner tbody').sortable();
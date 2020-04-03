// Get the modal
var modal_help = document.getElementById('help_page');
var modal_about = document.getElementById('about_page');
var step1card = document.getElementById("card_first_step");
var step2card = document.getElementById("card_second_step");
var step3card = document.getElementById("card_third_step");
var dots = document.getElementsByClassName("dot");
var files = document.getElementById('apk_to_install');
var deviceInfoMl = document.getElementById('multiline_device_info');
var usb_state = -1;

//step3_click_function();

//- Using a function pointer:
//document.getElementById("refresh_usb").onclick = connect_usb();

// When the user clicks anywhere outside of the modal, close it
window.onclick = function(event) {
	if (event.target == modal_help || event.target == modal_about) {
		modal_help.style.display = "none";
	}
};

async function step1_click_function()
{
	showLoader();
	var i;
	await connect_usb();
	console.log(usb_state);
	if (usb_state>2) {
		await grabDeviceInfo();
		hideLoader();
		step1card.style.display = "none";
		step2card.style.display = "block";
		step3card.style.display = "none";
		for (i = 0; i < dots.length; i++) {
			dots[i].className = dots[i].className.replace(" active", "");
		}
		dots[1].className += " active";
	}else{
		hideLoader();
	}
	
};

async function refresh_usb_function()
{
	await connect_usb();
}

async function step2_click_function()
{
	showLoader();
	await push_usb();
	await execute_usb("shell:pm install -g /sdcard/Download/test_yade.apk");
	await execute_usb("shell:rm /sdcard/Download/test_yade.apk");
	hideLoader();
	
	var i;
	step1card.style.display = "none";
	step2card.style.display = "none";
	step3card.style.display = "block";
	for (i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(" active", "");
	}
	dots[2].className += " active";
	//disconnect_usb();
};

async function step3_click_function()
{
	showLoader();
	await disconnect_usb();
	hideLoader();
		
	var i;
	step1card.style.display = "block";
	step2card.style.display = "none";
	step3card.style.display = "none";
	for (i = 0; i < dots.length; i++) {
		dots[i].className = dots[i].className.replace(" active", "");
	}
	dots[0].className += " active";
};



function showSnackBar(msg)
{
	// Get the snackbar DIV
	var x = document.getElementById("snackbar");

	x.textContent = msg;
	// Add the "show" class to DIV
	x.className = "show";

	// After 3 seconds, remove the show class from DIV
	setTimeout(function() { x.className = x.className.replace("show", ""); }, 3000);
};


function showLoader()
{
	// Get the loader DIV
	let loadDiv = document.getElementById("loadingPopUp");

	loadDiv.style.visibility='visible';
	//loadDiv.textContent = "Loading, Please Wait!";
	// Add the "show" class to DIV
	//loadDiv.className = "show";
};


function hideLoader()
{
	// Get the loader DIV
	let loadDiv = document.getElementById("loadingPopUp");
	loadDiv.style.visibility='hidden';
	//loadDiv.className = loadDiv.className.replace("show", "");
};

function setState(message)
{
	var msg = message.toString();
	console.log("usb state -> "+msg);
	usb_state = -1;
	if (msg.includes("diconnecting")){
		usb_state =0;
	} else if (msg.includes("ready")) {
		usb_state =1;
	} else if (msg.includes("connecting")) {
		usb_state =2;
	} else if (msg.includes("connected")) {
		usb_state =3;
	} else if (msg.includes("running")) {
		usb_state =4;
	}		
};

/**
* [ro.boot.serialno]: [1736d533]
* [ro.build.display.id]: [11.0.0-19-C.HMT-1.G]
* [ro.build.id]: [OPM1.171019.026]
* [ro.build.product]: [msm8953_64]
* [ro.build.version.base_os]: [Android 8.1.0]
*/
function parseInfoLine(myText)
{
	console.log(typeof myText);
	var lines = myText.toString().split("\n");
	var numLines = lines.length;
	var i;
	var parseResult = new Array();

	// parse sections
	for (var i = 0 ; i < numLines; i++) {
		var line = lines[i];
		if (line.includes("ro.boot.serialno")) {
			parseResult.push(line);
		} else if (line.includes("ro.build.display.id")) {
			parseResult.push(line);
		} else if (line.includes("ro.build.id")) {
			parseResult.push(line);
		} else if (line.includes("ro.build.product")) {
			parseResult.push(line);
		} else if (line.includes("ro.build.version.base_os")) {
			parseResult.push(line);
		}
	}	
	
	return parseResult;	
};

async function grabDeviceInfo()
{
	let getpropInfo = "";
	let deviceProp = null;
	
	getpropInfo = execute_usb("shell:getprop");
	deviceInfoMl.innerHTML = " text to display \n I guess";
	if (getpropInfo) {
		deviceProp = parseInfoLine(getpropInfo);
		if (Array.isArray(deviceProp) && deviceProp.length) {
			deviceInfoMl.innerHTML = deviceProp.toString();
		}
	}
	
}

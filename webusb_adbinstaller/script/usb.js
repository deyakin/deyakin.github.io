//- Using a function pointer:
//document.getElementById("refresh_usb").onclick = connect_usb();

var _webusb = null;
var _adb = null;
var _fastboot = null;
var _adb_shell = null;
var _apk_file = null;
var sync = null;

function set_file(fileblob)
{
	_apk_file=fileblob;
};

async function connect_usb_bis()
{
	try {
		if (_webusb != null) {
		    setState("disconnecting");
			disconnect_usb();
			setState("ready");
			return;
		} else {
			console.log("connecting");
			setState("connecting");
			_webusb = await Adb.open("WebUSB");
		}

		if (!_webusb || !(_webusb.isAdb() || _webusb.isFastboot()))
			throw new Error("Could not open either ADB or Fastboot");
	}
	catch(error) {
		console.log(error);
		showSnackBar(error.message + "check adb is not running");
		webusb = null;
		return;
	}
	if (_webusb.isFastboot()) {
		try {
			_fastboot = null;
			_fastboot = await this._webusb.connectFastboot();
			if (fastboot != null) {
				console.log("FASTBOOT mode");
				showSnackBar("FASTBOOT mode");
			}
		}
		catch (error) {
			console.log(error);
			showSnackBar(error.message);
			_fastboot = null;
			_webusb = null;
			return;
		}
	}

	if (_webusb.isAdb()) {
		try {
			_adb = null;
			_adb = await this._webusb.connectAdb("host::", () =>
			console.log("Please check the screen of your " + this._webusb.device.productName + "."));
			showSnackBar("Please check the screen of your " + this._webusb.device.productName + ".");
			if (_adb != null) {
				console.log("ADB mode");
				setState("connected");
			}
		}
		catch (error) {
			console.log(error);
			showSnackBar(error.message);
			_adb = null;
			_webusb = null;
			return;
		}
	}
};

async function connect_usb()
{
	try {
		if (_webusb != null) {
			setState("disconnecting");
			disconnect_usb();
			setState("ready");
			return;
		} else {
			setState("connecting");
			_webusb = await Adb.open("WebUSB");
		}

		if (!_webusb || !(_webusb.isAdb() || _webusb.isFastboot()))
			throw new Error("Could not open either ADB or Fastboot");
	}
	catch(error) {
		console.log(error);
		showSnackBar(error.message);
		setState("ready");
		_webusb = null;
		return;
	}

	if (_webusb.isFastboot()) {
		try {
			_fastboot = null;
			_fastboot = await _webusb.connectFastboot();
			if (_fastboot != null) {
				console.log("FASTBOOT mode");
				setState("connected");
				//this.execute_cmd("getvar:all");
			}
		}
		catch(error) {
			console.log(error);
			showSnackBar(error.message + " Ensure that the USB port is not in use (i.e. adb server is running).");
			setState("ready");
			_fastboot = null;
			_webusb = null;
			return;
		}
	}

	if (_webusb.isAdb()) {
		try {
			_adb = null;
			_adb = await _webusb.connectAdb("host::", () =>
			showSnackBar("Please check the screen of your " + _webusb.device.productName + "."));

			if (_adb != null) {
				console.log("ADB mode");
				setState("connected");
				//execute_usb("shell:getprop");
				/*this.stat_filename("/sdcard/Download/test_webadb.txt");
				this.pull_filename("/sdcard/Download/test_webadb.txt");
				this.push_dest("/sdcard/Download/test_webadb.txt");
				this.push_mode("0644");*/
			}
		}
		catch(error) {
			console.log(error);
			showSnackBar(error.message + " Ensure that the USB port is not in use (i.e. adb server is running).");
			setState("ready");
			_adb = null;
			_webusb = null;
			return;
		}
	}

	let message = "";

	if (_webusb.isAdb())
		message = "ADB: ";
	if (_webusb.isFastboot())
		message = "FASTBOOT: ";

	message += _webusb.device.productName + " (" + _webusb.device.manufacturerName + ")";
	showSnackBar(message);
};

async function disconnect_usb()
{
	if (_adb_shell != null)
		_adb_shell.close();
	if (sync != null)
		await sync.abort();
	if (_webusb != null)
		_webusb.close();
	_webusb = null;
};

// functiion to give percent of download
var xfer_stats_done = 0;
var xfer_stats_time = 0;

function xfer_stats(start_time, done, total)
{
	let now = Date.now();

	if (now - xfer_stats_time < 500)
		return;

	if (xfer_stats_done > done)
		xfer_stats_done = 0;
	if (xfer_stats_time < start_time)
		xfer_stats_time = start_time;

	let delta = Math.round((now - start_time) / 1000);
	let instant = Math.round(((done - xfer_stats_done) * 1000) / ((now - xfer_stats_time) * 1024));
	let average = Math.round(done * 1000 / ((now - start_time) * 1024));

	xfer_stats_done = done;
	xfer_stats_time = now;

	let out = "";
	out += Math.round(100 * done / total) + "% (";
	out += Math.round(done / 1024) + " KiB in ~" + delta + " secs at avg " + average + " KiB/s, cur " + instant + " KiB/s)";
	console.log(out);
};

// functiion to push file on device
async function push_usb()
{
	let push_dest = "/sdcard/Download/test_yade.apk";
	let push_mode =  "0644";
	try {
		if (_adb != null ) {
			setState("running");
			console.log("Loading " + _apk_file[0] + "...");

			sync = await _adb.sync();
			let start_time = Date.now();
			await sync.push( _apk_file[0], push_dest, push_mode,
			(done, total) => xfer_stats(start_time, done, total));

			await sync.quit();
			sync = null;
			setState("connected");
		}
	}
	catch(error) {
		console.log(error);
		showSnackBar(error.message);
		setState("connected");
	}
};

async function execute_usb(cmd)
{
	let decoder = new TextDecoder();
	var line;
	var textOutput = "";

	try {
		if (_adb != null ) {
			setState("running");
			console.log("");

			shell = await _adb.open(cmd);
			r = await shell.receive();
			while (r.cmd == "WRTE") {
				if (r.data != null) {
					line = decoder.decode(r.data);
					textOutput.concat(line);
					console.log(line);
				}

				shell.send("OKAY");
				r = await shell.receive();
			}

			shell.close();
			shell = null;
			setState("connected");
		}

		if (_fastboot != null ) {
			setState("running");
			console.log("");

			await _fastboot.send(cmd);
			r = await _fastboot.receive();
			while (_fastboot.get_cmd(r) == "INFO") {
				line = decoder.decode(_fastboot.get_payload(r)) + "\n";
				textOutput.concat(line);
				console.log(line);
				r = await _fastboot.receive();
			}

			let payload = _fastboot.get_payload(r);
			if (payload.length > 0)
				payload += "\n";
			line = decoder.decode(payload);
			textOutput.concat(line);
			console.log(line);
			setState("connected");
		}
		return textOutput;
	}
	catch(error) {
		console.log(error);
		showSnackBar(error.message);
		setState("ready");
		_webusb = null;
	}
}
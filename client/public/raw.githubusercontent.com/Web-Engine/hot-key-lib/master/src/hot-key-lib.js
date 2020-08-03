function HotKey() {
    const keyNames = {
        8: "BACK-SPACE",
        9: "TAB",

        12: "NUMPAD-CENTER", // NUMPAD-5 without numlock
        13: "ENTER",

        16: "SHIFT",
        17: "CTRL",
        18: "ALT",
        19: "PAUSE-BREAK",
        20: "CAPS-LOCK",

        27: "ESC",

        32: "SPACE",
        33: "PAGE-UP",
        34: "PAGE-DOWN",
        35: "END",
        36: "HOME",
        37: "LEFT-ARROW",
        38: "UP-ARROW",
        39: "RIGHT-ARROW",
        40: "DOWN-ARROW",

        44: "PRINT-SCREEN",
        45: "INSERT",
        46: "DELETE",

        // 48~57: 0~9

        // 65~90: A~Z

        91: "META",
        92: "META",
        93: "SELECT",

        // 96~105: NUMPAD-0~9

        106: "NUMPAD-*",
        107: "NUMPAD-+",
        109: "NUMPAD--",
        110: "NUMPAD-.",
        111: "NUMPAD-/",

        // 112~123: F1~F12

        144: "NUM-LOCK",
        145: "SCROLL-LOCK",
        186: ";",
        187: "=",
        188: ",",
        189: "-",
        190: ".",
        191: "/",
        192: "`",
        219: "[",
        220: "\\",
        221: "]",
        222: "'"
    };

    var hotKeys = {
        ALL: []
    };

    var settings = {
        preventDefault: false,
        metaToCtrl: false,
        noNumpadNum: false
    };

    this.add = function(key, func) {
        if (key instanceof Array) {
            var t = this;
            key.forEach(function (k) {
                t.add(k, func);
            });

            return;
        }

        key = key.toString().toUpperCase();

        if (!hotKeys[key]) {
            hotKeys[key] = [];
        }

        hotKeys[key].push(func);
    };

    this.remove = function (key, func) {
        if (key instanceof Array) {
            var t = this;
            key.forEach(function (k) {
                t.remove(k, func);
            });

            return;
        }

        key = key.toString().toUpperCase();
        if (!hotKeys[key]) return;

        if (func) {
            var idx = hotKeys[key].indexOf(func);
            if (idx < 0) return;

            hotKeys[key].splice(idx, 1);
        }
        else {
            delete hotKeys[key];
        }
    };

    this.setup = function(options) {
        for (var k in options) {
            settings[k] = options;
        }
    };

    function getKeyCode(e) {
        return e.keyCode || e.which;
    }

    function getFullKeyString(e) {
        var keyCode = getKeyCode(e);
        var key = [];

        if (e.ctrlKey) {
            key.push("CTRL");
        }

        if (e.metaKey) {
            if (settings.metaToCtrl) {
                if (!e.ctrlKey) {
                    key.push("CTRL");
                }
            }
            else {
                key.push("META");
            }
        }

        if (e.shiftKey) {
            key.push("SHIFT");
        }

        if (e.altKey) {
            key.push("ALT");
        }

        if (
            keyCode == 16 || // SHIFT
            keyCode == 17 || // CTRL
            keyCode == 18 || // ALT
            keyCode == 91 || // META (left)
            keyCode == 92    // META (right)
        ) {
            return key.join("+");
        }

        key.push(getKeyString(e));

        return key.join("+");
    }

    function getKeyString(e) {
        var keyCode = getKeyCode(e);

        if (keyNames[keyCode]) {
            return keyNames[keyCode];
        }
        else if (96 <= keyCode && keyCode <= 105) {
            if (settings.noNumpadNum) {
                return (keyCode - 96).toString();
            }
            else {
                return "NUMPAD-" + (keyCode - 96);
            }
        }
        else if (112 <= keyCode && keyCode <= 123) {
            return "F" + (keyCode - 111);
        }
        else {
            return String.fromCharCode(keyCode);
        }
    }

    function onKeyDown(e) {
        var keyFullString = getFullKeyString(e);
        var keyString = getKeyString(e);
        var keyCode = getKeyCode(e);

        e.which = keyCode;
        e.keyCode = keyCode;
        e.keyFullString = keyFullString;
        e.keyString = keyString;

        hotKeys.ALL.forEach(function (macro) {
            macro.call(document, e);
        });

        if (!hotKeys[keyFullString]) return;

        if (settings.preventDefault) {
            e.preventDefault();
        }

        hotKeys[keyFullString].forEach(function (macro) {
            macro.call(document, e);
        });
    }

    function _start(target) {
        if (target.addEventListener) {
            target.addEventListener("keydown", onKeyDown);
        }
        else if (target.attachEvent) {
            target.attachEvent("onkeydown", onKeyDown);
        }
    }

    function _stop(target) {
        if (target.removeEventListener) {
            target.removeEventListener("keydown", onKeyDown);
        }
        else if (target.detachEvent) {
            target.detachEvent("onkeydown", onKeyDown);
        }
    }

    this.start = function (target) {
        if (target == null) {
            target = document;
        }

        this.target = target;

        if (target instanceof Array) {
            for (var i=0; i<target.length; i++) {
                _start(target[i]);
            }
        }
        else {
            _start(target);
        }
    };

    this.stop = function () {
        if (this.target instanceof Array) {
            for (var i=0; i<this.target.length; i++) {
                _stop(this.target[i]);
            }
        }
        else {
            _stop(this.target);
        }
    };
}

const ping = require('ping');
const fs = require('fs');
const nodemailer = require('nodemailer');

var transporter;
var settings;
var offline_devices = [];

console.log("\x1b[33m\n","███████╗███████╗██████╗ ██╗   ██╗███████╗██████╗     ███╗   ███╗ ██████╗ ███╗   ██╗██╗████████╗ ██████╗ ██████╗ ");
console.log("\x1b[33m","██╔════╝██╔════╝██╔══██╗██║   ██║██╔════╝██╔══██╗    ████╗ ████║██╔═══██╗████╗  ██║██║╚══██╔══╝██╔═══██╗██╔══██╗");
console.log("\x1b[33m","███████╗█████╗  ██████╔╝██║   ██║█████╗  ██████╔╝    ██╔████╔██║██║   ██║██╔██╗ ██║██║   ██║   ██║   ██║██████╔╝");
console.log("\x1b[33m","╚════██║██╔══╝  ██╔══██╗╚██╗ ██╔╝██╔══╝  ██╔══██╗    ██║╚██╔╝██║██║   ██║██║╚██╗██║██║   ██║   ██║   ██║██╔══██╗");
console.log("\x1b[33m","███████║███████╗██║  ██║ ╚████╔╝ ███████╗██║  ██║    ██║ ╚═╝ ██║╚██████╔╝██║ ╚████║██║   ██║   ╚██████╔╝██║  ██║");
console.log("\x1b[33m","╚══════╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═╝    ╚═╝     ╚═╝ ╚═════╝ ╚═╝  ╚═══╝╚═╝   ╚═╝    ╚═════╝ ╚═╝  ╚═╝\n");

fs.readFile('./settings.json', 'utf8', (err, data) => {

    if (err) {
        console.log(`Error reading json file: ${err}`);
    } else {

        settings = JSON.parse(data);
        var hosts = [];

        console.log("\x1b[33m", "Monitoring: ")

        settings["devices"].forEach(device => {
            hosts.push(device.host);
            console.log("\x1b[33m", "   - " + device.name + " (" + device.host + ")");
        });

        console.log();

        transporter = nodemailer.createTransport({
            service: settings["email"]["service"],
            auth: {
              user: settings["email"]["auth"]["user"],
              pass: settings["email"]["auth"]["pass"]
            }
        });

        const interval = setInterval(function() {
            ping_devices(hosts);
        }, settings["check_interval"]*1000);

        const interval2 = setInterval(function() {
            notify_again();
        }, settings["notify_after"]*1000);
    }

});

function ping_devices(hosts){
    hosts.forEach(function(host){
        ping.sys.probe(host, function(isAlive){
            if(!isAlive){
                var name = "Unknown";

                settings["devices"].forEach(device => {
                    if(device.host == host) name = device.name;
                });
                
                if(offline_devices.includes(host)) return;
                
                transporter.sendMail(getMailOptions(name, host, false), function(error, info){
                    if (error){
                        console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] Error: Email can't be sent. Please check if your username and password are correct and also if you have enabled access for less secure applications in Gmail.");
                        console.log("\x1b[31m", "Link: https://support.google.com/mail/?p=BadCredentials");
                    }else{
                        console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] " + name + " (" + host + ") is down! (Email sent)");
                        offline_devices.push(host);
                    }
                });

            }else{
                if(offline_devices.includes(host)){
                    var name = "Unknown";

                    settings["devices"].forEach(device => {
                        if(device.host == host) name = device.name;
                    });

                    offline_devices.splice(offline_devices.indexOf(host), 1);

                    transporter.sendMail(getMailOptions(name, host, true), function(error, info){
                        if (error){
                            console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] Error: Email can't be sent. Please check if your username and password are correct and also if you have enabled access for less secure applications in Gmail.");
                            console.log("\x1b[31m", "Link: https://support.google.com/mail/?p=BadCredentials");
                        }else{
                            console.log("\x1b[33m", "[" + new Date().toLocaleString() + "] " + name + " (" + host + ") is back up! (Email sent)");
                        }
                    });
                } 
            }
        });
    });
}

function notify_again(){
    offline_devices.forEach(host => {
        var name = "Unknown";

        settings["devices"].forEach(device => {
            if(device.host == host) name = device.name;
        });

        transporter.sendMail(getMailOptions(name, host, false), function(error, info){
            if (error){
                console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] Error: Email can't be sent. Please check if your username and password are correct and also if you have enabled access for less secure applications in Gmail.");
                console.log("\x1b[31m", "Link: https://support.google.com/mail/?p=BadCredentials");
            }else{
                console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] " + name + " (" + host + ") is down! (Email sent)");
            }
        });
    });
}

function getMailOptions(name, host, is_up){
    if(is_up){
        return mailOptions = {
            from: settings["email"]["options"]["from"],
            to: settings["email"]["options"]["to"],
            subject: settings["email"]["options"]["up"]["subject"].replace("{host}", host).replace("{name}", name),
            html: settings["email"]["options"]["up"]["text"].replace("{host}", host).replace("{name}", name)
        };
    }
    return mailOptions = {
        from: settings["email"]["options"]["from"],
        to: settings["email"]["options"]["to"],
        subject: settings["email"]["options"]["down"]["subject"].replace("{host}", host).replace("{name}", name),
        html: settings["email"]["options"]["down"]["text"].replace("{host}", host).replace("{name}", name)
    };
}



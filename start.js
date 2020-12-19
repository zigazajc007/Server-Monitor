const ping = require('ping');
const fs = require('fs');
const nodemailer = require('nodemailer');

var transporter;
var settings;

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

                transporter.sendMail(getMailOptions(name, host), function(error, info){
                    if (error) {
                      console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] Error: " + error.response);
                    } else {
                      console.log("\x1b[31m", "[" + new Date().toLocaleString() + "] " + name + " (" + host + ") is down! (Email sent)");
                    }
                });
            }
        });
    });
}

function getMailOptions(name, host){
    return mailOptions = {
        from: settings["email"]["options"]["from"],
        to: settings["email"]["options"]["to"],
        subject: settings["email"]["options"]["subject"].replace("{host}", host).replace("{name}", name),
        text: settings["email"]["options"]["text"].replace("{host}", host).replace("{name}", name)
    };
}



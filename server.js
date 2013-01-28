//setup Dependencies
var connect = require('connect')
    , express = require('express')
    , io = require('socket.io')
    , port = (process.env.PORT || 2234)
    , settings = require('./settings');

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.set('view options', { layout: false });
    server.use(connect.bodyParser());
    server.use(express.cookieParser());
    server.use(express.session({ secret: "udm3x09242x*marvad"}));
    server.use(connect.static(__dirname + '/static'));
    server.use(server.router);
});

var email   = require("emailjs/email");
var smtpserver  = email.server.connect({
   user:    settings.smtp.user, 
   password:settings.smtp.password, 
   host:    settings.smtp.server, 
   ssl:     true
});


var cronJob = require('cron').CronJob;
new cronJob('00 30 21 * * *', function(){
  console.log('Crontab');

  Item.findAll({order: 'time ASC', offset: 0, where: ["kind == 'ride' AND time >= DATETIME('now', '-2 hours', 'localtime')"]}).ok(function(items) {
    if (items.length > 0) {
      var html_data = "";
      for (var i=0;i<items.length;i++) {
        items[i]
        var time = items[i].time.getDate()+"/"+(items[i].time.getMonth()+1)+" "+items[i].time.getHours()+':'+(items[i].time.getMinutes()<10?'0':'') + items[i].time.getMinutes();
        var data = "<li><strong>" + time + "</strong> - " +  items[i].content + "</li>"
        html_data = html_data+data
      };
      Subscriber.findAll({ where: {freq: 'day'}}).ok(function(subscribers) {
        for (var i=0;i<subscribers.length;i++) {
          submit = "http://"+settings.domain+"/submit"
          unsubscribe = "http://"+settings.domain+"/remove_email?id="+new Buffer(subscribers[i].email).toString('base64')
          var message = {
             text:    "HTML content", 
             from:    "מרבד הקסמים <noreply@"+settings.domain+">", 
             to:      subscribers[i].email,
             subject: "נסיעות עתידיות במרבד",
             attachment: 
             [
                {data: '<html><div dir="rtl" style="direction: rtl; text-align: right;">' +
                  '<h1>נסיעות קסומות במרבד</h1>' +
                  html_data +
                  '<br/>דואר זה נשלח אליכם על כנפיו של <a href="http://'+settings.domain+
                  '">מרבד הקסמים</a>.<br/>נוסעים לאנשהו? <a href="'+submit+
                  '">פרסמו גם אתם וספרד דה לאב!</a><br/><br/>--<br/>להפסיק לקבל התראות? <a href="'+unsubscribe+
                  '">לחצו כאן</a>' +
                  '</div></html>', alternative:true}
             ]
          };

          // send the message and get a callback with an error or details of the message that was sent
          smtpserver.send(message, function(err, message) { console.log(err || message); });
        };
      });
    };
  });
}, null, true);

server.dynamicHelpers({
  capable_client: function (req, res) {
      var capable_client = false;
      var ua = req.headers['user-agent'];
      if ( ua.indexOf("Android") > 0  ||
           ua.indexOf("Firefox") > 0 ||
           ua.indexOf("like Mac OS X") > 0 ||
           ua.indexOf("Chrome") > 0 ||
           ua.indexOf("BlackBerry") > 0 ||
           ua.indexOf("MSIE 7") > 0 ||
           ua.indexOf("MSIE 8") > 0 ||
           ua.indexOf("MSIE 9") > 0 ||
           ua.indexOf("MSIE 10") > 0 ||
           ua.indexOf("Windows Phone" > 0)) {
        capable_client = true;
      }
      return capable_client;
  }, menu: function (req, res) {
      return req.url.slice(1);
  }
});


// Monkey-patching
String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
}

String.prototype.endsWith = function(suffix) {
    return this.match(suffix+"$") == suffix;
};

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.jade', { locals: { 
                  title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.jade', { locals: { 
                  title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port );


//Setup Socket.IO
var io = io.listen(server);
io.sockets.on('connection', function(socket){
  console.log('Client Connected');
  socket.on('message', function(data){
    socket.broadcast.emit('server_message',data);
    socket.emit('server_message',data);
  });
  socket.on('disconnect', function(){
    console.log('Client Disconnected.');
  });
});


// Load phone numbers
var phones = require('./phones.json')

// Initillize DB
var Sequelize = require("sequelize")
var sequelize = new Sequelize('database', 'username', 'password', {
  dialect: 'sqlite',
  storage: 'database.sqlite'
})
var Item = sequelize.import(__dirname + "/Item");
var Subscriber = sequelize.import(__dirname + "/Subscriber");

// Restart DB
// Item.sync({force: true})
// Subscriber.sync({force: true})

///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

server.get('/logout', function(req,res) {
    res.cookie('pass', '', { domain: settings.cookie.domain });
    res.redirect("/");
});

server.get('/login', function(req,res) {
  res.render('login.jade', {
    errors: false,
  });
});

server.post('/add_email', function(req,res) {
  Subscriber.find({ where: {email: req.body.useremail} }).ok(function(subscriber) {
    if (subscriber !== null) {
      subscriber.destroy().on('ok', function(u) {
        console.log('deleted subscriber');
      });
    }

    var subscriber = Subscriber.build({
      email: req.body.useremail,
      freq: req.body.when,
    });
    errors = subscriber.validate();
    if (errors) {
      res.render('message.jade', {
        locals : { message: errors }
      });
    } else {
      subscriber.save().ok(function(subscriber) {
        res.render('message.jade', {
          locals : { message: "המייל נקלט במערכת. נהיה בקשר!" }
        });
      });
    }

  });
});

server.post('/login', function(req,res) {
  if (req.body.pass === settings.cookie.pass) {
    res.cookie('pass', settings.cookie.pass, { maxAge: 3600000, domain: settings.cookie.domain });
    res.redirect('/');
  } else {
    res.render('login.jade', {
      errors: true,
    });    
  }
});

server.get('/', function(req,res){
  if ( req.cookies.pass !== settings.cookie.pass ){
    res.redirect('/login');
  }
  Subscriber.findAll().ok(function(subs) { console.log(subs) });
  Item.findAll({order: 'time ASC', offset: 0, where: ["kind == 'ride' AND time >= DATETIME('now', '-2 hours', 'localtime') AND time < DATE('now', '+1 days', 'localtime')"]}).ok(function(today_items) {
    Item.findAll({order: 'time ASC', offset: 0, where: ["kind == 'ride' AND time >= DATE('now', '+1 days', 'localtime') AND time < DATE('now', '+2 days', 'localtime')"]}).ok(function(tomorrow_items) {
      Item.findAll({order: 'time ASC', offset: 0, where: ["kind == 'ride' AND time >= DATE('now', '+2 days', 'localtime') AND time < DATE('now', '+3 days', 'localtime')"]}).ok(function(tomorrowow_items) {
        Item.findAll({order: 'time ASC', offset: 0, where: ["kind == 'ride' AND time >= DATE('now', '+3 days', 'localtime') AND time < DATE('now', '+4 days', 'localtime')"]}).ok(function(tomorrowowow_items) {

          var weekday=new Array(7);
          weekday[0]="ראשון";
          weekday[1]="שני";
          weekday[2]="שלישי";
          weekday[3]="רביעי";
          weekday[4]="חמישי";
          weekday[5]="שישי";
          weekday[6]="שבת מנוחה";

          weekday = weekday.concat(weekday);

          var d=new Date();
          d = d.getDay();
          res.render('index.jade', {
            locals : { today : today_items, tomorrow : tomorrow_items, tomorrowow : tomorrowow_items, tomorrowowow : tomorrowowow_items, weekday: weekday, day: d }
          });
        });
      });
    });
  });
});

/*
server.get('/others', function(req,res){
  Item.findAll({order: 'time DESC', offset: 0, limit: 10, where: {kind: 'other'}}).ok(function(items) {
    res.render('items.jade', {
      locals : { items : items }
    });
  }).error(function(err) {
    res.render('items.jade', {
      locals : { items : [] }
    });
  });
});
*/

server.get('/remove/:id', function(req,res){
  Item.find(parseInt(req.params.id, 10)).ok(function(item) {
    res.render('remove.jade', {
      locals : { item : item}
    });
  });
});

server.post('/delete', function(req,res){
  Item.find(parseInt(req.body.id, 10)).ok(function(item) {
    item.destroy().on('ok', function(u) {
      console.log('deleted item');
    });
  });
  res.redirect('/');
});

server.get('/about', function(req,res){
  res.render('about.jade', {
    locals : { }
  });
});

server.get('/submit', function(req,res){
  res.render('submit.jade', {
    locals : { errors: null }
  });
});

server.post('/', function(req,res){
  current = new Date()
  rideTime = new Date(current.getFullYear(),
              current.getMonth(),
              current.getDate()+parseInt(req.body.daysfromnow),
              parseInt(req.body.time.split(':')[0], 10),
              parseInt(req.body.time.split(':')[1], 10),
              0,
              0);
  var ride = Item.build({
    content: req.body.content,
    name: req.body.name,
    phone: req.body.phone,
    kind: req.body.kind,
    time: rideTime,
  })
  errors = ride.validate();
  if (errors) {
    console.log(errors)
    res.render('submit.jade', {
      locals : { errors: errors }
    });
  } else {
    ride.save().ok(function(ride) {
      io.sockets.emit('server_message', ride.values);

      submit = "http://"+settings.domain+"/submit"
      day = {"0": "היום", "1": "מחר", "2": "מחרתיים", "3": "אחרתיים"}
      time = ride.time.getDate()+"/"+(ride.time.getMonth()+1)+" "+ride.time.getHours()+':'+(ride.time.getMinutes()<10?'0':'') + ride.time.getMinutes();

      Subscriber.findAll({ where: {freq: 'post'}}).ok(function(subscribers) {
        for (var i=0;i<subscribers.length;i++)
        {
          unsubscribe = "http://"+settings.domain+"/remove_email?id="+new Buffer(subscribers[i].email).toString('base64')
          smtpserver.send({
             text:    "פרסום חדש במרבד!\n\nמאת: "+
                      ride.name +
                      "\nמועד: " + day[req.body.daysfromnow] + " " + time +
                      "\nתוכן: " + ride.content +
                      "\n\nדואר זה נשלח אליכם על כנפיו של מרבד הקסמים.\nhttp://"+settings.domain+
                      "\n\nנוסעים לאנשהו? פרסמו גם אתם וספרד דה לאב!\n"+submit+
                      "\n\n--\nלהפסיק לקבל התראות? לחצו כאן: \n "+unsubscribe, 
             from:    "מרבד הקסמים <noreply@"+settings.domain+">", 
             to:      subscribers[i].email,
             subject: "נסיעה: " + day[req.body.daysfromnow] + " " + time + " - " + ride.content
          }, function(err, message) { console.log(err || message); });
        }
      });
      
      res.redirect('/');
    });
  }
});

server.get('/remove_email', function(req, res){
    email = new Buffer(req.query.id, 'base64').toString('ascii');
    Subscriber.find({ where: {email: email} }).ok(function(subscriber) {
      if (subscriber !== null) {
        subscriber.destroy().on('ok', function(u) {
          console.log('deleted subscriber');
        });
      }
    });
    res.render('message.jade', {
      locals : { message: "לא תקבלו עוד עדכונים. חבל" }
    });
});

server.post('/submit_sms', function(req,res){
  console.log(req.body);
  console.log(req.body.message);
  if ( req.body.message.startsWith('רכב:') == true ) {
    var name = phones[req.body.from.slice(4)];
    var phone = '0'+req.body.from.slice(4);
    var ride = Item.create({
      content: req.body.message.slice(4),
      phone: phone,
      name: name,
      kind: 'ride'
    }).ok(function(ride) {
      io.sockets.emit('server_message', ride.values);
      res.send('{ "payload": { "success": "true", "task": "send", "messages": [ { "to": "'+ req.body.from +'", "message": "מרבד הקסמים קיבל את הודעתך. תודה!" }] }}');
    });
  };
});

//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Marvad started on http://0.0.0.0:' + port );

// test
module.exports = function (suppressLogs) {
    var //fs = require('fs'),
        connect = require('connect'),
        express = require('express'),
        orm = require('orm'),
        app = express(),
        emitter = require('./event-emitter')(),
        swig = require('swig'),
        passport = require('passport'),
        flash = require('connect-flash'),
        http = require('http'),
        roles = require('./lib/roles'),
        swigHelpers = require('./helpers/swig'),
        enums = require('./enums'),
        router = require('./routing/router'),
        log = require('./log'),
        controllers = {},
        heroku,
        db_url;

    //initial log functions.
    log.init(enums);

    controllers.questions = require('./controllers/questions');
    controllers.question_comments = require('./controllers/question_comments');
    controllers.answers = require('./controllers/answers');
    controllers.answer_comments = require('./controllers/answer_comments');
    controllers.users = require('./controllers/users');
    controllers.ratings = require('./controllers/ratings');
    controllers.crises = require('./controllers/crises');



    app.use(connect.urlencoded());
    app.use(connect.json());
    
    // To allow use of all HTTP methods in the browser through use of _method variable
    app.use(express.methodOverride());

    app.set('port', process.env.PORT || enums.options.port);
    
    app.engine('html', swig.renderFile);
    app.set('view engine', 'html');
    app.set('views', __dirname + '/views');
    // Swig will cache templates for you, but you can disable
    // that and use Express's caching instead, if you like:
    app.set('view cache', false);
    // To disable Swig's cache, do the following:
    swig.setDefaults({ cache: false });
    // NOTE: You should always cache templates in a production environment.
    // Don't leave both of these to `false` in production!
    
    // Set up swig helpers for compilation/rendering pages.
    swigHelpers(swig);
    
    // Static file handling
    // app.use(express.static(__dirname + '/static'));
    
    app.use('/static', express.static('static'));


    //prevent big package and return 413 error
    // app.use(connect.limit('5kb'));
    app.use(connect.limit('5mb'));

    // Overwrite demo.sh at the start of execution because it is appended to.
    //if (enums.document) {
    //    fs.writeFile(enums.demo, '#!/bin/bash\n\n', function (err) {
    //        if (err) {
    //            throw err;
    //        }
    //    });
    //}

    heroku = (process.env.HEROKU_POSTGRESQL_BLACK_URL !== undefined);
    //heroku = false;
    //heroku = (process.env.HEROKU_POSTGRESQL_JADE_URL !== undefined);
    //console.log('process.env',process.env);
    if (heroku){
    	db_url = process.env.HEROKU_POSTGRESQL_BLACK_URL;
    } else {
    	db_url = "sqlite://app.db";
        
    }
    console.log('db_url:', db_url);
    
    // Set up the ORM to SQLite.
    app.use(orm.express(db_url, {
        define: function (db, models, next) {

            // Instance.cache is an important setting.
            // By default the cache is enabled but this means
            // that fields set not in the create() function will not be
            // picked up by the model (all fields successfully save into DB).
            db.settings.set('instance.cache', false);

            db.load("./models", function (err) {
                if (err === null || err === undefined) {
                    if (!suppressLogs) {
                        console.logger.info('Model loaded');
                    }
                } else {
                    console.logger.error('Model loading failed:');
                    console.logger.error(err);
                }

                models.Crisis = db.models.crisis;
                models.Post = db.models.post;
                models.Question = db.models.question;
                models.Answer = db.models.answer;
                models.Comment = db.models.comment;
                models.QuestionComment = db.models.question_comment;
                models.AnswerComment = db.models.answer_comment;
                models.Rating = db.models.rating;
                models.User = db.models.user;
                models.Local = db.models.local;
                models.Facebook = db.models.facebook;

                models.Local.sync(function () {console.log("Local synced")});
                models.QuestionComment.sync(function () {console.log("QuestionComment synced")});
                models.AnswerComment.sync(function () {console.log("AnswerComment synced")});
                models.Crisis.sync(function () {console.log("Crisis synced")});
                models.Post.sync(function () {console.log("Post synced")});
                models.User.sync(function () {console.log("User synced")});
                models.Question.sync(function () {console.log("Question synced")});
                models.Answer.sync(function () {console.log("Answer synced")});
                models.Comment.sync(function () {console.log("Comment synced")});
                models.Rating.sync(function () {console.log("Rating synced")});
                models.Facebook.sync(function () {console.log("Facebook synced")});

                // Post is the base class.
                // Questions, answers and comments are types of Post.

                db.sync(function () {
                    emitter.emit('model-synced');
                    if (!suppressLogs) {
                        console.logger.info("Model synchronised");
                        createAdmin(db.models.user, db.models.local);
                    }
                });
            });
            next();
        }
    }));

    app.use(express.cookieParser());
    app.use(express.bodyParser({
        uploadDir: __dirname + '/static/images/submissions-pre'
    }));
    app.use(express.session({ secret: 'cat' }, {maxAge: new Date(Date.now() + 3600000)}));
    app.use(flash());
    app.use(passport.initialize());
    app.use(passport.session());
    app.use(roles.user.middleware());
    
    app.use(app.router);

//    app.listen();
//
//    if (!suppressLogs) {
//        console.logger.info('Server started on ' + enums.options.hostname + ':' + enums.options.port);
//    }
//
//    // Configure the routes.
    router(app, controllers);
    http.createServer(app).listen(app.get('port'), function(){
        console.log('Express server listening on port ' + app.get('port'));
    });

    //process.on('SIGINT', function () {
    //    console.logger.info('Server stopped.');
    //    process.exit(1);
    //});

    var createAdmin = function (User, Local) {
        User.exists({name: 'Admin'}, function (err, exists) {
            if (err) {throw err;}
            if (!exists) {
                User.create([{
                    name: 'Admin',
                    role: 'admin'
                }], function (err, u_created) {
                    if (err) {throw err;}
                    var admin = u_created[0];
                    Local.create([{
                        email: 'Admin'
                    }], function (err, l_created) {
                        if (err) {throw err;}
                        var local = l_created[0];
                        local.password = local.generateHash('1234');
                        local.save(function (err) {
                            if (err) {throw err;}
                            admin.setLocal(local, function (err) {
                                if (err) {throw err;}
                                console.log('Admin user has been created.');
                            });
                        });
                    });
                });
            } else {
                console.log('Admin user already exists.');
            }
        });
    }

};

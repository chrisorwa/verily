var bcrypt   = require('bcrypt-nodejs'),
    orm = require('orm');

module.exports = function (db, cb) {
    
    var Session = db.define('session', {
        sid: {
            type: 'text'
        },
        value: {
            type: 'text'
        }
    });
    
    // Stores a referral at the point of its instantiation
    var Referral = db.define('referral', {
        refCode: {
            type: 'text'
        },
        destinationPath: {
            type: 'text'
        },
        medium: {
            type: 'text'
        },
        type: {
            type: 'text'
        },
        date: {
            type: 'date',
            time: true
        }
    });
    
    // Route impression
    var Impression = db.define('impression', {
       path: {
           type: 'text'
       },
       requestMethod: {
           type: 'text'
       },
       date: {
           type: 'date',
           time: true
       },
       ip: {
           type: 'text'
       },
       userAgent: {
           type: 'text'
       },
       httpRefererUrl: {
           type: 'text'
       }
    });
    
    // Social event, such as a Tweet, Facebook post
    var SocialEvent = db.define('socialEvent', {
        eventSourceId: {
            type: 'text'
        },
        path: {
            type: 'text'
        },
        medium: {
            type: 'text'
        },
        type: {
            type: 'text'
        },
        authorSourceId: {
            type: 'text'
        },
        authorSourceUsername: {
            type: 'text'
        },
        content: {
            type: 'text'
        },
        date: {
            type: 'date',
            time: true
        },
        ip: {
            type: 'text'
        },
        userAgent: {
            type: 'text'
        }
    });


    //  TODO: Ensure on migrration to MongoDB that default value is set to current timestamp equivalent or that it isn't the cause of an error
    var Post = db.define('post', {
        title: {
            type: 'text'
        },
        text: {
            type: 'text'
        },
        targetLocality: {
            type: 'text'
        },
        targetLat: {
            type: 'number'
        },
        targetLong: {
            type: 'number'
        },
        automaticLocation: {
            type: 'boolean'
        },
        targetImage: {
            type: 'text'
        },
        targetYoutubeVideoId: {
            type: 'text'
        },
        targetVideoUrl: {
            type: 'text'
        },
        targetDateTimeOccurred: {
            type: 'date',
            time: true
        },
        date: {
            type: 'date',
            time: true
        },
        author: {
            type: 'text'
        },
        tags: {
            type: 'object'
        },
        updated: {
            type: 'date',
            time: true
        },
        viewCount: {
            type: 'number'
        }
        },
        {
            methods: {
                getUpvoteCount: function(){
                    return this.ratings.filter(function(rating){return rating.isUpvote()}).length;
                },
                getDownvoteCount: function(){
                    return this.ratings.filter(function(rating){return rating.isDownvote()}).length;
                },
                getImportanceCount: function(){
                    return this.ratings.filter(function(rating){return rating.isImportance()}).length;
                },
                isUpvotedBy: function(user){
                    var ratings = this.ratings.filter(function(rating){return (user.id == rating.user_id) && rating.isUpvote()});

                    return ratings.length > 0;
                },
                isDownvotedBy: function(user){
                    return this.ratings.filter(function(rating){return (user.id === rating.user_id) && rating.isDownvote()}).length > 0;
                },
                isMarkedImportantBy: function(user){
                    return this.ratings.filter(function(rating){return (user.id == rating.user_id) && rating.isImportance()}).length > 0;
                },
                addViewCount: function(){
                    this.viewCount++;
                    this.save();
                }
            }
        },
        {
            validations:{
                title:[orm.enforce.notEmptyString("Title Required"), orm.enforce.required("Title Required")]
            }
        }), Question = db.define('question', {
            // knownAnswer: {
            //     type: 'text'
            // }
    },
        {
            methods: {
                getSupportedAnswerCount: function(){
                    //If the answers are loaded returns amount of them of type Support, else not loaded returns 0!
                    if(this.answers != undefined){
                        return this.answers.filter(function(a){return a.isSupport() && a.show}).length;
                    }
                    else{
                        return 0;
                    }
                },
                getRejectedAnswerCount: function(){
                    //If the answers are loaded returns amount of them of type Reject, else not loaded returns 0!
                    if(this.answers != undefined){
                        return this.answers.filter(function(a){return a.isAgainst() && a.show}).length;
                    }
                    else{
                        return 0;
                    }
                }
            }
        }), Answer = db.define('answer', {
        type: {
            type: 'enum',
            values: ['support', 'reject']
        },
        show: {
            type: 'boolean',
            defaultValue: '1'
        } 
    }, {
        methods: {
            isSupport: function(){
                return this.type == "support";
            },
            isAgainst: function(){
                return this.type == "reject";
            }
        }, autoFetchLimit: 2
    }), Comment = db.define('comment',{
        date: {
            type: 'date',
            time: true
        },
        text: {
            type: 'text'
        },
        updated: {
            type: 'date',
            time: true
        },
        show: {
            type: 'boolean',
            defaultValue: '1'
        }
    }), QuestionComment = db.define('question_comment', {
    },{
        autoFetch: true,
        autoFetchLimit: 2
    }), AnswerComment = db.define('answer_comment', {
    },{
        autoFetch: true,
        autoFetchLimit: 2
    }), Rating = db.define('rating', {
        type: {
            type: 'enum',
            values: ['importance', 'upvote', 'downvote']
        },
        date: {
            type: 'date',
            time: true
        },
        author: {
            type: 'text'
        }
    },
        {
            methods: {
                isUpvote: function(){
                    return this.type == 'upvote';
                },
                isDownvote: function(){
                    return this.type == 'downvote';
                },
                isImportance: function(){
                    return this.type == 'importance';
                },
            }
        }
    ), Local = db.define('local', {
        email: {
            type: 'text'
        },
        password: {
            type: 'text'
        },
        resetPasswordToken: {
            type: 'text'
        },
        resetPasswordExpires: {
            type: 'date',
            time: true
        },
        verificationToken: {
            type: 'text'
        },
        verified: {
            type: 'boolean',
            defaultValue: '0'
        }
    }, {
        methods: {
            validPassword: function (pass) {
                return bcrypt.compareSync(pass, this.password); 
            }, 
            generateHash: function (pass) {
                return bcrypt.hashSync(pass, bcrypt.genSaltSync(8), null);
            }
        }
    }), Facebook = db.define('facebook', {
        facebookId: {
            type: 'text'
        },
        token: {
            type: 'text'
        },
        email: {
            type: 'text'
        }
    }), Twitter = db.define('twitter', {
        twitterId: {
            type: 'text'
        }, 
        token: {
            type: 'text'
        }
    }), User = db.define('user', {
            name: {
                type: 'text',
            },
            type: {
                type: 'enum',
                values: ['chosen-username', 'provisional']
            },
            role: {
                type: 'enum',
                values: ['editor', 'simple', 'admin']
            },
            signupPoints: {
                type: 'number',
                defaultValue: 0
            },
            votingPoints: {
                type: 'number',
                defaultValue: 0
            },
            postPoints: {
                type: 'number',
                defaultValue: 0
            },
            active: {
                type: 'boolean',
                defaultValue: '1'
            }
    },
        {
            methods: {
                isEditor: function(){
                    return this.role === 'editor'
                },
                //Currently not being used but can be used for a better maintainability
                getDisplayName: function(){
                    return this.name;
                },
                getTotalPoints: function () {
                    var points = this.signupPoints + this.votingPoints + this.postPoints;
                    return points;
                }
            }
        },{validations: {
        name: [orm.enforce.unique("name already taken!"),orm.enforce.ranges.length(1, undefined, "missing")],
    }}), Crisis = db.define('crisis', {
    });

    Answer.hasOne('question', Question, {
        reverse: 'answers'
    });

    Question.hasOne('post', Post, {reverse: 'questions', autoFetch: true});

    Answer.hasOne('post', Post, {reverse: 'answers', autoFetch: true});

    Rating.hasOne('post', Post, {reverse: 'ratings', autoFetch: true});

    Rating.hasOne('user', User, {reverse: 'ratings'});

    Comment.hasOne('user', User, {reverse: 'comments'}, {
        autoFetch: true
    });

    QuestionComment.hasOne('question', Question, {
        reverse: 'comments',
        autoFetch: true
    });
    QuestionComment.hasOne('comment', Comment);

    AnswerComment.hasOne('answer', Answer, {
        reverse: 'comments', autoFetch: true
    });

    AnswerComment.hasOne('comment', Comment, {
        reverse: 'answerComment',
        autoFetch: true
    });

    Crisis.hasOne('post', Post, {reverse: 'crisis', autoFetch: true});
    Question.hasOne('crisis', Crisis, {
        reverse: 'questions'
    });

    Post.hasOne('user', User, {
        reverse: 'posts', autoFetch: true
    });
    
    Referral.hasOne('user', User, {
        reverse: 'authoredReferrals', autoFetch: true
    });
    
    Impression.hasMany('referrals', Referral, {}, {
        key: true, reverse: 'impressions', autoFetch: true
    });
    
    Impression.hasOne('user', User, {
        reverse: 'impressions', autoFetch: true
    });
    

    User.hasOne('local', Local, {
        reverse: 'users'
    });
    User.hasOne('facebook', Facebook, {
        reverse: 'users', autoFetch: true
    });
    User.hasOne('twitter', Twitter, {
        reverse: 'users', autoFetch: true
    });

    if (cb) {
        cb();
    }
};

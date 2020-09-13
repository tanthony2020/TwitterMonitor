var Cylon = require('cylon');
var Gpio = require('onoff').Gpio;
var Twitter = require('twitter');
const dotenv = require('dotenv');

var numbertweets = 0;
var day = new Date().getDate();
dotenv.config();
var LED = new Gpio(24, 'out');
var client = new Twitter({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token_key: process.env.TWITTER_ACCESS_TOKEN_KEY, 
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

var follow = {follow: process.env.FOLLOW_USERID}
var followUserName = process.env.FOLLOW_USERNAME;
var status = "Trump, the #Potus, instead of fighting the pandemic, spent his day tweeting. Yesterday he sent ";
console.log("starting robot");
Cylon.robot({
    connections: {
      raspi: { adaptor: 'raspi' }
    },
    
     work: function(raspi) {
        console.log("calling twitter");
        client.stream('statuses/filter', { follow: process.env.FOLLOW_USERID}, function (stream) {
            console.log("Checking for @" + followUserName + " tweets");
            stream.on('data', function (data) {
                if (data.user.screen_name==followUserName)
                {
                    numbertweets++;
                    
                    console.log("@" + followUserName + " Tweeted");
                    console.log("@" + data.user.screen_name + " :: " + data.text);
                    
                    LED.writeSync(1); // turn light on
                    setTimeout(function () {LED.writeSync(0);}, 2000);

                    var currentDay = new Date().getDate();
                    // if current day does not match the start day then it's a new day
                    if (currentDay != day)
                    {
                        console.log("It's a new day (CurrentDay = " + currentDay + ") and yesterday is (" + day + ")");
                        var tweetstatus = status + numbertweets + " tweets. Vote @JoeBiden to save America. #BidenHarris2020 #BuildBackBetter #VoteBlue"; 
                        // send tweet 
                        client.post('statuses/update', { status: tweetstatus}, function (error, tweet, response) {
                            if (error)
                            {
                                console.log("There was an error sending tweet", error);
                            }
                            
                            console.log("Your tweet was sent: " + tweet.text);
                         });
                        // reset today
                        day = currentDay;
                        // reset the number of tweets
                        numbertweets = 0;
                    }
                    else
                    {
                        console.log("It's the same day (CurrentDay = " + currentDay + ") and yesterday is (" + day + ")");
                        console.log("Trump has tweeted " + numbertweets + " so far today");
                    }
                }
                
            });
        });
    }
}).start();


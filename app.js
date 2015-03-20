/**
 * Created by jmjeong on 15. 3. 19..
 */

var scrapy = require('node-scrapy')
    , async = require('async')
    , _ = require('lodash')
    , config = require('./config.json')
    , CronJob = require('cron').CronJob
    , url = 'http://www.steambb.com/m/bbs/board.php?bo_table=sale'

function fetch_detail(url, callback) {
    var num = url.match(/id=(\d+)/)[1];
    var url = 'http://www.steambb.com/m/bbs/board.php?bo_table=sale&wr_id=' + num;
    var model = {
        title: 'div[class!="board_list"] > .subject',
        description: 'div[style="padding:10px;"] > div[style="line-height:18px;font-size:0.9em;"] span#writeContents1',
        date: 'body > div:nth-child(20) > div:nth-child(1) > div:nth-child(3) > div.wr_date'

    };
    scrapy.scrape(url, model, function(err, data) {
        if (err) return console.error(err);
        data.url = url;
        callback(data)
    })
}

var job = new CronJob({
    cronTime: config.cronTime,
    onTick: function() {
        async.waterfall([
            function(callback) {
                var model = {
                    subjects: 'div.board_list[id!="notice_wrapper"] > ul > li > div.subject',
                    links: {
                        selector: 'div.board_list[id!="notice_wrapper"] > ul > li',
                        get: 'onclick',
                    }
                };
                scrapy.scrape(url, model, function (err, data) {
                    if (err) return console.error(err);
                    callback(err, data)
                })
            },
            function(data, callback) {
                async.parallel(_.map(data.links, function (link) {
                    return function(cb) {
                        fetch_detail(link, function(data) {
                            cb(null, data);
                        })};
                }), function (err, result) {
                    var RSS = require('rss');

                    var feed = new RSS({
                        title: '스팀비비: 할인정보',
                        description: '스팀비비: 할인정보 페이지',
                        link: url,
                        pubDate: _.now()
                    });
                    // console.log(result)
                    _.map(result, function (n) {
                        // console.log(n)
                        feed.item(n)
                    });

                    var xml = feed.xml();
                    callback(null, xml)
                })
            }], function(error, data) {
                if (error) {
                    console.err(error)
                }
                var MemoryStream = require('memorystream');
                var stream = new MemoryStream(data);
                var Uploader = require('s3-streaming-upload').Uploader;

                stream.end('')

                upload = new Uploader({
                    // credentials to access AWS
                    accessKey:  config.AWS_S3_ACCESS_KEY,
                    secretKey:  config.AWS_S3_SECRET_KEY,
                    bucket:     config.AWS_S3_BUCKET,
                    objectName: "steambb.rss",
                    stream:     stream,
                    objectParams: {
                        ACL: 'public-read'
                    },
                    debug:      true
                });

                upload.send(function (err) {
                    if (err) {
                        console.error('Upload error' + err);
                    }
                    console.log('Done');
                });
            }
        )
    },
    start: true
})

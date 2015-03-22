[SteammBB 할인정보](http://www.steambb.com/bbs/board.php?bo_table=sale) 게시물을 RSS로 만드는
node app.

RSS을 생성 후에 [amazon s3](https://s3.amazonaws.com/jmjeong/steambb.rss)에 publish 한다.

### config.json

```json
{
	"cronTime" : "0 10,40 * * * *",             
	"AWS_S3_ACCESS_KEY" : "AWS_S3_ACCESS_KEY",  
	"AWS_S3_SECRET_KEY" : "AWS_S3_SECRET_KEY",  
	"AWS_S3_BUCKET" : "AWS_S3_BUCKET"           
}
```

- cronTime : 게시물 긁어오는 시간. 매 시 10분, 40분에 읽어옴
- AWS_S3_ACCESS_KEY : S3 access key
- AWS_S3_SECRET_KEY : S3 secret key
- AWS_S3_BUCKET : bucket 이름

### 실행

```sh
npm install
pm2 start app.js
```

### 참고

node-scrapy : CSS selector는 chrome의 개발자 도구에서 `Copy CSS Path`를 이용하면 쉽게 얻을 수 있다.

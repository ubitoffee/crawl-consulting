const axios = require("axios");
const cheerio = require('cheerio');

function jsonToQueryString(json) {
  return '?' + 
      Object.keys(json).map(function(key) {
          return encodeURIComponent(key) + '=' +
              encodeURIComponent(json[key]);
      }).join('&');
}

const params = {
  'searchQulId': '0',
  'searchOrderRegNum': 'DESC',
  'searchOrderQulNm': 'DESC',
  'searchOrderQulYear': 'DESC',
  'searchOrderMethodRow': 'qulRegNum DESC',
  'searchQulCpCd': '0000',
  'searchQulNm': '상담',
  'searchMemNm': '',
  'searchQulRegYy': '0000',
  'searchQulRegNum': '',
  'pageIndex': 2,
};

const arr = [];

const rows = [
  [
    "등록번호",
    "구분",
    "자격명",
    "자격관리발급기관",
    "주무부처",
    "여성가족부",
    "자격정보",
    "직무내용 1급",
    "직무내용 2급",
    "직무내용 3급",
    "홈페이지",
    "대표번호",
    "주소",
  ],
];


for (var i = 1; i <= 1; i++) {
  arr.push(i);
}
arr.forEach((i) => {
  params.pageIndex = i;
  axios.post(
    'https://pqi.or.kr/inf/qul/infQulList.do',
    jsonToQueryString(params),
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    }
  ).then((res) => {
    const $ = cheerio.load(res.data);
    console.log(`${$('title')}${i}`);
    const codeArr = ['59734'];

    return codeArr;
  }).then((codeArr) => {
    codeArr.forEach((code) => {
      const newParam = Object.assign({}, params);
      newParam.searchQulId = code;
      newParam.searchQulRegYy = '0000';
      console.log(newParam);
      console.log(jsonToQueryString(newParam));

      axios.post(
        'https://pqi.or.kr/inf/qul/infQulBasDetail.do',
        jsonToQueryString(newParam),
        {
          headers: {
            'Content-Type': 'text/html;charset=UTF-8',
          },
        },
      ).then((res) => {
        const $ = cheerio.load(res.data);
        console.log(res.data);
      });
    });
  });
})
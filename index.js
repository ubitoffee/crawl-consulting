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
    "자격정보",
    "직무내용 1급",
    "직무내용 2급",
    "직무내용 3급",
    "홈페이지",
    "대표번호",
    "주소",
  ],
];

for (let i = 1; i <= 1; i += 1) {
  arr.push(i);
}
arr.forEach((i) => {
  params.pageIndex = i;
  axios.post(
    `https://pqi.or.kr/inf/qul/infQulList.do${jsonToQueryString(params)}`,
    {
      headers: {
        'Content-Type': 'text/html;charset=UTF-8',
      },
    }
  ).then((res) => {
    const $ = cheerio.load(res.data);
    const row = $("#qulListTb tbody tr");
    const codeArr = [];
    for (let i = 0; i < row.length; i += 1) {
      const contents = [];
      contents.push(row.eq(i).find("td").eq(0).text()); // 등록번호
      contents.push(row.eq(i).find("td").eq(1).text()); // 구분
      contents.push(row.eq(i).find("td").eq(2).find("a").text().trim()); // 자격명
      contents.push(row.eq(i).find("td").eq(2).attr("title")); // 자격정보
      console.log(contents);
    }


    return codeArr;
  }).then((codeArr) => {
    // codeArr.forEach((code) => {
    //   const newParam = Object.assign({}, params);
    //   newParam.searchQulId = code;
    //   newParam.searchQulRegYy = '0000';

    //   axios.post(
    //     `https://pqi.or.kr/inf/qul/infQulBasDetail.do${jsonToQueryString(newParam)}`
    //   ).then((res) => {
    //     const $ = cheerio.load(res.data);
    //     console.log(res);
    //   });
    // });
  });
});
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

let axios = require("axios");
const cheerio = require('cheerio');
const fs = require('fs');

const writeStream = fs.createWriteStream("심리-6.xls");

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
  'pageIndex': 1,
};

const arr = [];

const rows = [
  "등록번호",
  "구분",
  "자격명",
  "자격관리발급기관",
  "주무부처",
  "자격정보",
  "직무내용 1급",
  "직무내용 2급",
  "직무내용 3급",
  "기관명",
  "홈페이지",
  "대표번호",
  "주소",
];

for (let i = 301; i <= 328; i += 1) {
  arr.push(i);
}

let csvContent = "";
writeStream.write(rows.join("\t") + "\n");

const getList = (i) => {
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
    'pageIndex': 1,
  };
  params.pageIndex = i;

  return new Promise((resolve, reject) => {
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
      const tempCodeArr = [];
      const keyArr = [];
      console.log('page 내 개수 ', row.length);
      for (let i = 0; i < row.length; i += 1) {
        const contents = [];
        contents.push(row.eq(i).find("td").eq(0).text()); // 등록번호
        contents.push(row.eq(i).find("td").eq(1).text()); // 구분
        contents.push(row.eq(i).find("td").eq(2).find("a").text().trim()); // 자격명

        tempCodeArr.push(contents);
        const keyCode = row.eq(i).find("td").eq(2).find("a").attr("href");
        keyArr.push(keyCode.substring(19, keyCode.lastIndexOf("'")));
        console.log(contents);
      }

      console.log('page data crate done');

      resolve({
        tempCodeArr,
        keyArr,
      });
    });
  });
};

const newMain = () => {
  return new Promise((resolve, reject) => {
    let entityObj = {
      keyArr: [],
      tempCodeArr: [],
    };
    let j = 0;
    arr.forEach((i) => {
      getList(i)
      .then((data) => {
        console.log(`${j+1}페이지 done`);
        j++;
        entityObj.tempCodeArr = entityObj.tempCodeArr.concat(data.tempCodeArr);
        entityObj.keyArr = entityObj.keyArr.concat(data.keyArr);

        if (j == arr.length) {
          resolve(entityObj);
        }
      });
    });

  });
};

const detailPromise = (entity, key) => {
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
    'pageIndex': 1,
  };
  params.searchQulId = key;
  params.searchQulRegYy = '0000';

  return new Promise((resolve, reject) => {
    axios.post(
      `https://pqi.or.kr/inf/qul/infQulBasDetail.do${jsonToQueryString(params)}`
    ).then((res) => {
      const $ = cheerio.load(res.data);
      const basicTable = $(".board_write");
      entity.push(basicTable.find("tr").eq(2).find("td").eq(0).text().trim()); // 주무부처
      entity.push($(".content_result").find(".text_square").text().trim()); // 자격정보

      // 직무내용 loop
      const jobContents = $(".board_pqi");
      for (let j = 0; j < 3; j += 1) {
        if (jobContents.eq(j).length > 0) {
          entity.push(jobContents.eq(j).find("tbody td").text().trim().replace(/"/g, ""));
        } else {
          entity.push("-");
        }
      }

      const orgDom = $("#divOrgDetail");

      if (orgDom) {
        const orgTable = orgDom.find("table");
        entity.push(orgTable.find("tr").eq(0).find("td").eq(0).text().trim()); // 기관명

        if (orgTable.find("tr").eq(1).find("td").eq(0).find("a").length > 0) {
          entity.push("http://" + orgTable.find("tr").eq(1).find("td").eq(0).find("a").text().trim()); // 홈페이지
        } else {
          entity.push("-");
        }
        entity.push(orgTable.find("tr").eq(2).find("td").eq(0).text().trim()); // 대표번호
        entity.push(orgTable.find("tr").eq(3).find("td").eq(0).text().trim()); // 주소
      }

      resolve(entity);
    }).catch((e) => {
      console.log(e);
    });
  });
};

const getFullData = () => {
  return new Promise((resolve, reject) => {
    newMain().then((result) => {
      const finalResult = [];
      let cnt = 0;
      result.keyArr.forEach((key, i) => {
        detailPromise(result.tempCodeArr[i], key).then((entity) => {
          cnt++;
          finalResult.push(entity);
          if (finalResult.length == result.keyArr.length) {
            resolve(finalResult);
          }
        });
      }); 
    });
  });
};

getFullData().then((result) => {
  console.log('총 건수: ', result.length);
  for (let i = 0; i < result.length; i += 1) {  
    writeStream.write(result[i].join("\t") + "\n");
  }

  writeStream.close();
});
var crypto = require('crypto');
var Sources = new BaaS.TableObject(38746);

function md5(str) {
    var md5sum = crypto.createHash('md5');
    md5sum.update(str);
    str = md5sum.digest('hex');
    return str;
}

function base64_decode(str) {
    return Buffer.from(str, 'base64').toString('ascii');
}

function time() {
    var a = new Date().getTime();
    return parseInt(a / 1000)
}

function chr(a) {
    return String.fromCharCode(a)
}

function ord(a) {
    return a.charCodeAt()
}

var jd16K92Q8ZNbu6FA7LfBJwNJUpmKRm5NV7 = function(n, t, e) {
    var f = "DECODE";
    var t = t ? t : "";
    var e = e ? e : 0;
    var r = 4;
    t = md5(t);
    var d = n;
    var p = md5(t.substr(0, 16));
    var o = md5(t.substr(16, 16));
    if (r) {
        if (f == "DECODE") {
            var m = n.substr(0, r)
        }
    } else {
        var m = ""
    }
    var c = p + md5(p + m);
    var l;
    if (f == "DECODE") {
        n = n.substr(r);
        l = base64_decode(n)
    }
    var k = new Array(256);
    for (var h = 0; h < 256; h++) {
        k[h] = h
    }
    var b = new Array();
    for (var h = 0; h < 256; h++) {
        b[h] = c.charCodeAt(h % c.length)
    }
    for (var g = h = 0; h < 256; h++) {
        g = (g + k[h] + b[h]) % 256;
        tmp = k[h];
        k[h] = k[g];
        k[g] = tmp
    }
    var u = "";
    l = (l+"").split("");
    for (var q = g = h = 0; h < l.length; h++) {
        q = (q + 1) % 256;
        g = (g + k[q]) % 256;
        tmp = k[q];
        k[q] = k[g];
        k[g] = tmp;
        u += chr(ord(l[h]) ^ (k[(k[q] + k[g]) % 256]))
    }
    if (f == "DECODE") {
        if ((u.substr(0, 10) == 0 || u.substr(0, 10) - time() > 0) && u.substr(10, 16) == md5(u.substr(26) + o).substr(0, 16)) {
            u = u.substr(26)
        } else {
            u = ""
        }
        u = base64_decode(d)
    }
    return u
}

function getPictureUrl(e) {
    return jd16K92Q8ZNbu6FA7LfBJwNJUpmKRm5NV7(e, "oiXqcqIlsGXEYVyyW5zGMcwhqCxpHim5");
}

const baseUrl = "https://jandan.net/ooxx/"

function get_data(page) {
  return new Promise((resolve, reject) => {
    console.log(baseUrl+page)

    // request page html
    BaaS.request.get(baseUrl+page, {responseType: 'document'}).then(res => {
      resolve(res)
    }, err => {
      reject(err)
    })
  });
}

function insert_items(records, success, error) {
  
  // storage pictures url to minapp.cloud
  Sources.createMany(records).then(res => { success(res) }, err => { 
    
    if(err.message == "400: 当前字段存在唯一索引，无法创建重复数据") {
      
      
      let query = new BaaS.Query()
      
      query.in('img', records.map((item) => {
        return item.img
      }))
      
      Sources.setQuery(query).limit(1000).find().then(res2 => {
        // success
        let exists = res2.data.objects.map((item) => {
          return item.img
        });
        
        console.log('exists', exists)
        
        let newRecords = records.filter((r) => {
          return exists.indexOf(r.img) === -1;
        })
        
        console.log('newRecords', newRecords)
        
        if(newRecords && newRecords.length > 0) {
          console.log('records:', records.length)
          console.log('newRecords:', newRecords.length)
          
          Sources.createMany(newRecords).then(res3 => { 
            console.log('new success', res3)
            success(res3) 
            
          }, err3 => { 
            console.log('new err', err3)
            // err
            error(err3);
          })
        } else
          success() 
        
      }, err2 => {
        // err
        error(err2);
      })
    }
  })
}

function get_page(page, callback){
  get_data(page > 0 ? ("page-"+page) : "").then(html => {
    var matches = html.data.match(/<span class="img-hash">([\s\S]*?$)/gm);
    console.log(matches.length + ' pics');
    
    var items = matches.map((item) => {
      return {
        type: 'jiandan',
        img: 'https:' + getPictureUrl(item.replace('<span class="img-hash">','').replace('</span>','').replace('<br />','').replace('</p>','')),
        category: '福利',
        created_by: 0
      }
    })
    
    insert_items(items, (ret) => {
      var m = /page-([\d]+)#comments" class="previous-comment-page">下一页/g.exec(html.data);
      if(m && m.length > 0) {
        var next = m[1];
        console.log('next page: ',next)
        if(next > 0 && ret)
          get_page(next, callback);
      }
      
      callback(null, 'done: ' + (ret ? ret.data.succeed: 'all exists'))
    },(err) => {
      callback(null, err)
    })
    
  }, err => {
    callback(err, 'query error')
  })
}

exports.main = function functionName(event, callback) {
    
  get_page(10000, callback);
  
}
// Code goes here

YUI().use('node', 'node-core', 'event', 'io','handlebars', 'json-parse', 'json-stringify', 'datatype-xml', 'yui-lang-later', 'datatype', 'model-list', function(Y) {
  
  var sbtnSpnner = Y.one('#sbtBtn span.spinner'),
    resultList = new Y.ModelList();
  resultList.comparator = function(model) {
    return model.get('id');
  };

//customXMLTOJSON Converter Functio
  function xmlToJson(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType == 1) { // element
      // do attributes
      if (xml.attributes.length > 0) {
        obj["@attributes"] = {};
        for (var j = 0; j < xml.attributes.length; j++) {
          var attribute = xml.attributes.item(j);
          obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
        }
      }
    } else if (xml.nodeType == 3) { // text
      obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
      for (var i = 0; i < xml.childNodes.length; i++) {
        var item = xml.childNodes.item(i);
        var nodeName = item.nodeName;
        if (typeof(obj[nodeName]) == "undefined") {
          obj[nodeName] = xmlToJson(item);
        } else {
          if (typeof(obj[nodeName].push) == "undefined") {
            var old = obj[nodeName];
            obj[nodeName] = [];
            obj[nodeName].push(old);
          }
          obj[nodeName].push(xmlToJson(item));
        }
      }
    }
    return obj;
  }

  Y.one('#sbtBtn').on('click', function() {
    var personObjJson = {};
    sbtnSpnner.toggleClass('icon-spin icon-refresh');
    
    //load person-info.json
    var jsonDelayHandle = Y.later(1000 * 5, window, function() {
      Y.io('./person-info.json', {
        headers: {
          'Content-Type': 'application/json'
        },
        on: {
          success: function(tx, r) {
            try {
              personObjJson = Y.JSON.parse(r.responseText);
              resultList.add(personObjJson.person);
           
            } catch (e) {
              alert("JSON Parse failed!");
              return;
            }
          }
        }
      });
    });

    
//load XML
    var xmlDelayHandle = Y.later(1000 * 10, window, function() {
      //load personInfo.xml
      Y.io('./person-info.xml', {
        headers: {
          'Content-Type': 'application/xml'
        },
        on: {
          success: function(tx, r) {

            var personObjLst,source,template,html;
            try {
              personObjLst = xmlToJson(r.responseXML);
              //converts the xmlObj to JSON Format 
              Y.Array.each(personObjLst.persons.person, function(person) {
                var tmpObj = {};
                if (person.hasOwnProperty("firstName")) {
                  tmpObj.firstName = person.firstName['#text'];
                }
                if (person.hasOwnProperty("lastName")) {
                  tmpObj.lastName = person.lastName['#text'];
                }
                if (person.hasOwnProperty("id")) {
                  tmpObj.id = parseInt(person.id['#text'], 10);
                }
                //add JSON to initial response
                resultList.add(tmpObj);
              });

             //sorts the modellist
              resultList.sort();
           
              // paint html to view
            source   = Y.one('#tmpltInfo').getHTML();
             template = Y.Handlebars.compile(source);
             
              html = template({person:resultList.toJSON()});
              Y.one('#personInfoTable').setHTML(html);
              sbtnSpnner.toggleClass('icon-spin icon-refresh');
            } catch (e) {
              alert("XML Parse failed!", e.error.message);
              return;
            }
          }
        }
      });
    }, [], false);






  });
});
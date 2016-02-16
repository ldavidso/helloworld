var url = "http://testing.shippingapis.com/ShippingAPITest.dll";
var userId = "";
//Caller zipcode field name
var zipCodeFieldName = "";
//Caller state field name
var stateFieldName = "";
//Caller city field name
var cityFieldName = "";

//Used to get city and state based on zipcode
function GetCityStateInfo() {
  var zip5 = $(zipCodeFieldName).val();
  var array = $(zipCodeFieldName).val().split("-");
  if (array.length > 1) {
    zip5 = array[0];
  }
  var USPSurl = url + '/?API=CityStateLookup&XML=<CityStateLookupRequest USERID="' + userId + '"><ZipCode ID="0"><Zip5>' + zip5 + '</Zip5></ZipCode></CityStateLookupRequest>';
  getCityState(USPSurl);
}

//Used to set the address url of USPS server based on mode

function setUrlMode(mode) {
  if (mode) {
    url = "http://testing.shippingapis.com/ShippingAPITest.dll";
  }
  else {
    url = "http://production.shippingapis.com/ShippingAPI.dll";
  }
}

function getCityState(USPSurl) {
  console.log("seding url");
  var xmlHttp = new XMLHttpRequest();
  xmlHttp.open( "GET", USPSurl, true );
  xmlHttp.onreadystatechange = function() {
    if(xmlHttp.readyState == 4 && xmlHttp.status == 200) {
      console.log("readystate: " + xmlHttp.readyState + " status: " + xmlHttp.status);
      var xml = xmlHttp.responseText,
      xmlDoc = $.parseXML( xml ),
      $xml = $( xmlDoc );
      var city = xmlDoc.getElementsByTagName("City")[0].childNodes[0].nodeValue;
      var state = xmlDoc.getElementsByTagName("State")[0].childNodes[0].nodeValue;

      if ( !city == "" ) {
        $(cityFieldName).val(city.toLowerCase().charAt(0).toUpperCase() + city.toLowerCase().slice(1));
      }

      if ( !state == "" ) {
        $(stateFieldName + " option[value=" + state + "]").attr("selected", "selected");
      }
    }
  }
  xmlHttp.send();
}

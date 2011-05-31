  //Add A Flickr API Key
  JW_API_KEY = "XXXXXXXX";
  JW_FLICKR_URL = "http://api.flickr.com/services/rest/?method=flickr.photos.search&api_key=" + JW_API_KEY + "&user_id=31355801%40N05&has_geo=1&extras=geo%2Cdate_taken&sort=date-taken-asc";  
       
  var jw_browser; //global!

  function newGeoBrowser() {
    jw_browser = new GeoBrowser();
  }
  
  //constructor
  GeoBrowser = function() {
    this.position = new google.maps.LatLng(37.75962, -122.426836); //start in dolores park
    this.map = this.createMap(this.position);
    this.jasper = this.createAvatar(this.map);
    this.trail = new MediaTrail();
    this.mediaViewer = null;
  };
  GeoBrowser.prototype = new google.maps.MVCObject();
  
  //factory method
  GeoBrowser.prototype.createMap = function(position) {
  		var myOptions = {
  		  zoom: 12,
  		  center: position = position,
  		  mapTypeId: google.maps.MapTypeId.HYBRID,
  		  streetViewControl: true,
  		  mapTypeControl: true,
  		  mapTypeControlOptions: {style: google.maps.MapTypeControlStyle.DROPDOWN_MENU},
  		  navigationControl: true,
  		  navigationControlOptions: {style: google.maps.NavigationControlStyle.SMALL, position: google.maps.ControlPosition.TOP_RIGHT},  
  		};
      newMap = new google.maps.Map(document.getElementById("map_canvas"), myOptions);
      this.addMarkers(newMap);
      return newMap;
  }
  
  //factory Method
  GeoBrowser.prototype.createAvatar = function(map) {
    var jasperIcon = new google.maps.MarkerImage('jasper_200.png',
        new google.maps.Size(83, 200),
        new google.maps.Point(0,0),
        new google.maps.Point(67, 196));

     avatar = new google.maps.Marker({position: map.center, title:'Jasper', icon:jasperIcon, zIndex: 1});
     avatar.setMap(map);
     //This tells the avatar postion to Observe the GeoBrower Position (google KVO)
     avatar.bindTo('position', this);
     return avatar;    
  }
  
  //TODO put data somewhere. fusion table? text file?
  GeoBrowser.prototype.addMarkers = function(map) {
        var setMarker = new google.maps.Marker({position: new google.maps.LatLng(37.75962, -122.426836), title:'Dyke March', zIndex: 2, icon: 'http://www.google.com/mapfiles/markerA.png'});
        setMarker.setMap(map);
        google.maps.event.addListener(setMarker, 'click', this.bind(function() {this.loadNewFeed('project10');}));
        
        setMarker = new google.maps.Marker({position: new google.maps.LatLng(37.765456,-122.432499), title:'Faetopia', zIndex: 2, icon: 'http://www.google.com/mapfiles/markerB.png'});
        setMarker.setMap(map);
        google.maps.event.addListener(setMarker, 'click', this.bind(function() {this.loadNewFeed('project9');}));
  }
  
  //controller map click event| Controller asks google feeds to load an rss, and gives a callback Controller function
  GeoBrowser.prototype.loadNewFeed = function(tag) {
      url = JW_FLICKR_URL + "&tags=" + tag + "&format=feed-georss";
      var feed = new google.feeds.Feed(url);
      feed.setResultFormat(google.feeds.Feed.MIXED_FORMAT);
      feed.setNumEntries(50); //50 seems to be the limit for google ajax feeds, sending paging parameters causes google feeds to choke as well. I just limit the media set numbers
      feed.load(this.bind(this.createMediaViewer));
      this.trail = new MediaTrail();
  }
  
  //called when the target rss is loaded
  GeoBrowser.prototype.createMediaViewer = function(result) {
      if (!result.error) {  
  	      var options = {displayTime:4000, transitionTime:600, scaleImages:true, random:false, 
  	                    transitionCallback: this.bind(this.updateSpaceTime), 
  	                    fullControlPanel : true, fullControlPanelSmallIcons : false,
                   //     imageClickCallback : this.bind(this.onImageClick), 
                        thumbnailUrlResolver: this.processFlickrUrl,
                        pauseOnHover : false
  	                    };
  	    
  	      this.mediaViewer = new GFslideShow(result.feed.entries, "slideShow", options);
  	  } else {
          alert("httpcode=" + result.error.code);
      }
  }
  
  
  //copied from google, this the object variable scope, this is the hardest part of javascript programming
  GeoBrowser.prototype.bind = function(method) {
    var self = this;
    var opt_args = [].slice.call(arguments, 1);
    return function() {
      var args = opt_args.concat([].slice.call(arguments));
      return method.apply(self, args);
    }
  };
  
  //parse the flickr thumbnail url into the default flickr picture url
  GeoBrowser.prototype.processFlickrUrl = function(entry) {
    var element = google.feeds.getElementsByTagNameNS(entry.xmlNode, "http://search.yahoo.com/mrss/", "thumbnail")[0];
  	return element.attributes.url.nodeValue.replace(/_s/g,"");
  }
  
  //called when geo media object focus changes in the media viewer
  GeoBrowser.prototype.updateSpaceTime = function(result) {
	    if ( result.error ) {
	      alert("feed load failed");
	    } else {
	      this.updateTime(result.xmlNode);
	      this.updateGeography(result.xmlNode);
	    }
	};
	
	GeoBrowser.prototype.updateTime = function(xmlNode) {
	    var el = document.getElementById("info");
      el.innerHTML = this.getTime(xmlNode).toLocaleDateString().toUpperCase() + " @" + this.getTime(xmlNode).toLocaleTimeString();
	}
	
	GeoBrowser.prototype.updateGeography = function(xmlNode) {
	  this.set ('position', this.getLatlng(xmlNode));
	  this.trail.setPosition(this.position, this.map)
    this.map.panTo(this.position);
  };
  
  //constructor
  MediaTrail = function(){
    //this is a random color generator
    this.color = '#'+Math.floor(Math.random()*16777215).toString(16);
    this.current = null;
  }
  
  
  MediaTrail.prototype.setPosition = function(position, map) { 
       if (this.current) {
    	    	var myPath = [this.current, position];
    				var myPathLine = new google.maps.Polyline({
    				    path: myPath,
    				    strokeColor: this.color,
    				    strokeOpacity: 1.0,
    				    strokeWeight: 4
    				});
    				myPathLine.setMap(map);
       }
       this.current = position;
    };
  
  
  
  //parses flickr georss xml item into a Google LatLng
  GeoBrowser.prototype.getLatlng = function(item) {
	  var latElement = google.feeds.getElementsByTagNameNS(item, "http://www.w3.org/2003/01/geo/wgs84_pos#", "lat")[0];
		var lat = latElement.firstChild.nodeValue;
		var lngElement = google.feeds.getElementsByTagNameNS(item, "http://www.w3.org/2003/01/geo/wgs84_pos#", "long")[0];
		var lng = lngElement.firstChild.nodeValue;
		return myLatlng = new google.maps.LatLng(lat, lng);
	};
  
  GeoBrowser.prototype.getTime = function(item) {
 	  var timeElement = google.feeds.getElementsByTagNameNS(item, "http://purl.org/dc/elements/1.1/", "date.Taken")[0];
 		var iso = timeElement.firstChild.nodeValue.substring(0,16);
 		return new Date(('' + iso).replace(/-/g,"/").replace(/[TZ]/g," "));
 	};
  
  
 //-------------------everything below this is experimental------------------------------------------------ 
  /**
   * The TagControl adds a control to the map that simply
   * returns the user to Chicago. This constructor takes
   * the control DIV as an argument.
   */

  function TagControl(controlDiv, map) {

    // Set CSS styles for the DIV containing the control
    // Setting padding to 5 px will offset the control
    // from the edge of the map
    controlDiv.style.padding = '5px';

    // Set CSS for the control border
    var controlUI = document.createElement('DIV');
    controlUI.style.backgroundColor = 'white';
    controlUI.style.borderStyle = 'solid';
    controlUI.style.borderWidth = '2px';
    controlUI.style.cursor = 'pointer';
    controlUI.style.textAlign = 'center';
    controlUI.title = 'Click to set the map to Tag';
    controlDiv.appendChild(controlUI);

    // Set CSS for the control interior
    var projectTag = document.createElement('SELECT');
    projectTag.style.fontFamily = 'Arial,sans-serif';
    projectTag.style.fontSize = '12px';
    //projectTag.style.paddingLeft = '4px';
    //projectTag.style.paddingRight = '4px';
    var objOption = document.createElement("option")
    objOption.text='Faetopia';
    objOption.value='project9';
    projectTag.options.add(objOption);
    var objOption = document.createElement("option")
    objOption.text='DykeMarch';
    objOption.value='project10';
    projectTag.options.add(objOption);
   
    controlUI.appendChild(projectTag);

    google.maps.event.addDomListener(projectTag, 'change', function() {
      geoBrowserController();
    });
  }
  
  
  //chokes on my dolores park coordinates
  function calcRoute(latlngs) {
    var directionsDisplay = new google.maps.DirectionsRenderer();
    directionsDisplay.setMap(map);
    var start = new google.maps.LatLng(37.75962, -122.426836);
    var end = new google.maps.LatLng(37.75962, -122.426838);
    var request = {
      origin:start, 
      destination:end,
      travelMode: google.maps.DirectionsTravelMode.WALKING
    };
    directionsService.route(request, function(result, status) {
      if (status == google.maps.DirectionsStatus.OK) {
        this.directionsDisplay.setDirections(result);
      }
    });
  }
  
  GeoBrowser.prototype.addControl = function() {
        var tagControlDiv = document.createElement('DIV');
         var tagControl = new TagControl(tagControlDiv, this.map);

        tagControlDiv.index = 1;
        this.map.controls[google.maps.ControlPosition.TOP_RIGHT].push(tagControlDiv);
}

 GeoBrowser.prototype.loadStreetView = function() {
      this.panorama = this.map.getStreetView();
      this.panorama.setPosition(new google.maps.LatLng(37.75962, -122.426836));
      this.panorama.setPov({
         heading: 265,
         zoom:1,
         pitch:0}
       );

      // this.panorama.setVisible(true);
  }
  
  function toggleStreetView() {
    var toggle = jw_browser.panorama.getVisible();
    if (toggle == false) {
      jw_browser.panorama.setVisible(true);
    } else {
      jw_browser.panorama.setVisible(false);
    }
  }
  
  


	



  

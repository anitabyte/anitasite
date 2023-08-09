//==UserScript==
// @name          Zoopla Search Better Maker
// @namespace     https://anitabyte.xyz
// @version       0.0.4
// @description   Show floor plans in search
// @author        anitabyte
// @run-at        document-idle
// @match         https://*.zoopla.co.uk/*
// @grant         none
// ==/UserScript==

function get_data(response, listing) {
    var domParser = new DOMParser();
    var dom = domParser.parseFromString(response, "text/html");
    var info_json = JSON.parse(dom.getElementById("__NEXT_DATA__").innerText);
    var pageProps = info_json["props"]["pageProps"];
    var listing_details = pageProps["listingDetails"];
    var detailed_description = listing_details["detailedDescription"].toLowerCase();
    var ad_targeting = listing_details["adTargeting"]
    var has_floorplan = ad_targeting["hasFloorplan"];
    var numBaths = listing_details["counts"]["numBathrooms"];
    var divs = listing.querySelectorAll("div");
    divs.forEach(div => { 
        if (numBaths >= 2) div.style.backgroundColor = "#238823";
        else if (numBaths == 0) div.style.backgroundColor = "#ffbf00";
        else div.style.backgroundColor = "#d2222d";
    });
    var infobox = document.createElement('div');
    var infotable = document.createElement('table');
    infotable.style.width = '100%';
    var infoTableObj = {
        "Tenure": ad_targeting["tenure"],
        "W/C": detailed_description.includes("w/c") || detailed_description.includes("wc")
    }
    infotable.innerHTML = Object.entries(infoTableObj).map(i => "<tr><td><b>" + i[0] + "</b></td><td>" + i[1] + "</td></tr>").join();
    infobox.append(infotable);
    if (has_floorplan) {
        var floorPlanImages = info_json["props"]["pageProps"]["listingDetails"]["floorPlan"]["image"]
        var floorPlanImgTags = floorPlanImages.map(i => "<img src='https://lid.zoocdn.com/u/2400/1800/" + i["filename"] + "' style='width:100%'>").join("<br />");
        var floorPlanBox = document.createElement('div');
        floorPlanBox.innerHTML = floorPlanImgTags;
        infobox.append(floorPlanBox);
    }
    listing.append(infobox);
}

function augment_listings_main() {
    /*if (document.URL.includes("page_size=25" || !document.URL.includes("page_size"))) {
        var domain = document.URL.match(/(\/\/.*\/\?)/i)[0];
        console.log(domain);
        var args = [...document.URL.matchAll(/[\?\&]([^\&\#]+)/g)].map(i => i[1]).filter(i => (!i.includes("page") && !i.includes("pn")));
        var arg_string = args.join("&") + "&page_size=500";
        var redirect_url = domain + arg_string;
        console.log(args);
        console.log(arg_string);
        console.log(redirect_url);
        window.location.replace(redirect_url);
        console.log("25 page");
    } */
    var listings = document.querySelectorAll('[id^=listing]');
    listings.forEach(listing => {
        var listing_url = listing.querySelector("a").href;
        listing.style.backgroundColor = "#ffff00";
        fetch(listing_url, { headers: { 'Content-Type': 'text/html' } }).then(response => response.text()).then(data => get_data(data, listing));
    });
}

function augment_listings_map() {
    var listing = document.querySelector('[data-testid="listing-card-portrait-mini"]');
    var listing_url = listing.getElementsByTagName('a')[0].href;
    fetch(listing_url, { headers: { 'Content-Type': 'text/html' } }).then(response => response.text()).then(data => get_data(data, listing));
    try {
        var num_bath = parseInt(listing.querySelector('[data-testid="bath"]').parentNode.parentNode.querySelector('[data-testid="text"]').textContent);
        if (num_bath < 2) listing.style.backgroundColor = '#ffb3ba';
        else listing.style.backgroundColor = '#baffc9';
    }
    catch (err) {
        listing.style.backgroundColor = '#ffffba';
    }
}

(function () {
    var observer = new MutationObserver(function (mutations) {
        var called = false;
        mutations.forEach(function (mutation) {
            if (mutation.addedNodes.length != 0 && !called) {
                try {
                    console.log(mutation);
                    if (mutation.addedNodes[0].innerHTML.includes('listing') || mutation.addedNodes[0].innerHTML.includes('data-testid="bath"')) {
                        if (document.URL.includes("/map/")) {
                            augment_listings_map();
                            called = true;
                        } else {
                            augment_listings_main();
                            called = true
                        }
                    }
                } catch (err) {
                    // there are some without 'innerhtml'
                }
            } else {

            }
        });
    });
    observer.observe(document, { subtree: true, childList: true });
    'use strict';
})();

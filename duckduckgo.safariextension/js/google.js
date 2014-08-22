/*
 * Copyright (C) 2012 DuckDuckGo, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var options = {};
var ddgBox;

function getQuery(direct) {
    var instant = document.getElementsByClassName("gssb_a");
    if (instant.length !== 0 && !direct){
        var selected_instant = instant[0];

        var query = selected_instant.childNodes[0].childNodes[0].childNodes[0].
                    childNodes[0].childNodes[0].childNodes[0].innerHTML;
        query = query.replace(/<\/?(?!\!)[^>]*>/gi, '');

        if(options.dev)
            console.log(query);

        return query;
    } else {
        return document.getElementsByName('q')[0].value;
    }
}

function qsearch(direct) {
    var query = getQuery(direct);
    ddgBox.lastQuery = query;
    ddgBox.search(query);
}

var ddg_timer;

// instant search
$("[name='q']").bind('keyup', function(e){
    query = getQuery();
    if(ddgBox.lastQuery !== query && query !== '')
        ddgBox.hideZeroClick();

    if(options.dev)
        console.log(e.keyCode);

    var fn = function(){ qsearch(); };

    if(e.keyCode == 40 || e.keyCode == 38)
        fn = function(){ qsearch(true); };

    clearTimeout(ddg_timer);
    ddg_timer = setTimeout(fn, 700);
});

$("[name='btnG']").bind('click', function(){
    qsearch();
});


var regexp = new RegExp(/^https?:\/\/(www|encrypted)\.google\..*\/.*$/);
if (regexp.test(window.location.href)) {

    $(document).ready(function(){
        safari.self.tab.dispatchMessage("get_settings");

        safari.self.addEventListener("message", function(event){
            if (event.name === "set_settings") {
                options = event.message;

                if(options.dev) console.log(event.message);

                ddgBox = new DuckDuckBox({
                            inputName: 'q',
                            forbiddenIDs: ['rg_s'],
                            hover: true,
                            contentDiv: (options.zeroclickinfo_google_right) ? 'rhs' : 'center_col',
                            className: 'google',
                            debug: options.dev
                          });

                ddgBox.search = function(query) {
                    if (query === undefined)
                        return;

                    // ditch the InstantAnswer Box if there is a Knowledge
                    // Graph result
                    if ($('#rhs_block ol .xpdopen').length > 0) {
                            return true;
                    }

                    safari.self.tab.dispatchMessage("request_google", query);
                    if(options.dev) console.log('sending request', query);

                    safari.self.addEventListener("message", function(event){
                        if(options.dev) console.log('message in');
                        if (event.name === "response_google") {
                            if(options.dev) console.log(event.message, query);
                            ddgBox.renderZeroClick(event.message, query);
                        }
                    }, false);

                    if (options.dev)
                        console.log("query:", query);
                }

                ddgBox.init();

            }
        }, false);

    });

}


"use strict";
/**
 * Created by gjr8050 on 9/2/2016.
 */

function buildPath(args) {
    return args.map(encodeURI).join("/").replace(/[^:]\/\//g, '/');
}

function getLastCommit(user, repo, branch){
    var githubUrl = "https://api.github.com/repos";
    var queryPath  = 'commits';
    var queryUri = buildPath([githubUrl, user, repo, queryPath]) + "?sha=" + encodeURIComponent(branch);

    return $.get(queryUri).then(function(results){
        return results[0].commit;
    });
}

function displayLastCommit(){
   getLastCommit("thunder033","RMWA","prod").then(commit => {
      var sCommit = "#lastCommit",
          sLink = ".commit-link",
          sDate = ".date",
          sMessage = ".message";

       console.log(commit);

       $(sLink, sCommit).attr("href", commit.url);
       $(sMessage, sCommit).html(commit.message);

       $(sDate, sCommit).html(moment(commit.author.date).fromNow());
   }, err => {
        console.log(err);
   });
}

window.addEventListener("load", displayLastCommit);
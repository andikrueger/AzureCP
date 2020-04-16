/// <reference path="../node_modules/@types/jquery/index.d.ts" />
// npm install --save @types/jquery
var GitHubStatistics;
(function (GitHubStatistics) {
    class RepoStats {
        constructor() {
            this.url = "https://azfunc-repository-stats.azurewebsites.net/api/GetLatestDocument";
        }
        getLatestStat() {
            //console.log("Sending query to " + this.url);            
            $.ajax({
                method: "GET",
                crossDomain: true,
                data: { project: "Yvand/AzureCP", code: "tvIuDNuA9O0TXN9E9HcZeF8hho3yzcwOCt7Dd5ohYFbdOqUxftrb0g==" },
                dataType: "jsonp",
                jsonpCallback: "GitHubStatistics.RepoStats.parseGitHubStatisticsResponse",
                url: this.url,
                success: function (responseData, textStatus, jqXHR) {
                },
                error: function (responseData, textStatus, errorThrown) {
                    console.log("Request to " + this.url + " failed: " + errorThrown);
                }
            });
        }
        static decodeJSONResponse(json) {
            var obj = Object.assign({}, json, {});
            return obj;
        }
        static parseGitHubStatisticsResponse(data) {
            var result = GitHubStatistics.RepoStats.decodeJSONResponse(data);
            $("#TotalDownloadCount").text(result.TotalDownloadCount);
            $("#LatestReleaseDownloadCount").text(result.LatestReleaseDownloadCount);
            $("#LatestReleaseTagName").text(result.LatestReleaseTagName);
            $("#LatestAssetUrl").attr("href", result.LatestAssetUrl);
            //$("#LatestReleaseCreationDate").text(result.LatestReleaseCreationDate);
        }
        ;
    }
    GitHubStatistics.RepoStats = RepoStats;
})(GitHubStatistics || (GitHubStatistics = {}));
$(document).ready(function () {
    let stats = new GitHubStatistics.RepoStats();
    let result = stats.getLatestStat();
});

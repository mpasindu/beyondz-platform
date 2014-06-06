// see below for example
function load_component_video_quiz() {
  // does async loading of the youtube script dependency
  // see: https://developers.google.com/youtube/iframe_api_reference
  function addYouTubeScript() {
    var tag = document.createElement('script');
    tag.src = "https://www.youtube.com/iframe_api";
    var firstScriptTag = document.getElementsByTagName('script')[0];
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag);
  }

  // this is called when the youtube script is loaded and prepares our usage of it,
  // searching for video containers and creating the YT players and event handlers
  function onYouTubeIframeAPIReady() {
    // reads time in the form of MM:SS and translates it to plain seconds
    function readTime(sTime) {
      if(sTime === null || sTime === "")
        return 0;
      var parts = sTime.split(":");
      return (((parts[0]|0) * 60) + (parts[1]|0));
    }

    // returns a closure that handles state change events
    // from youtube, e.g. video playing or video paused.
    //
    // Using the closure variables, it can handle multiple independent
    // players, creating a new timer for each of them and calculating
    // when quizzes need to be shown by looking at html attributes.
    function onPlayerStateChange(player, holder) {
      var interval = null;
      var quizzes = {};

      $(".quiz").each(function(idx, quiz) {
        quizzes[readTime(quiz.getAttribute("data-time-to-display"))] = quiz;
      });

      return function(event) {
        // if playing, we set the polling timer to check the time
	// and display stuff needed there. If it is not playing, we
	// stop the timer interval.
        if (event.data == YT.PlayerState.PLAYING) {
          if(interval)
            clearInterval(interval);
          interval = setInterval(function() {
            var time = Math.floor(player.getCurrentTime());
            if(quizzes[time]) {
              player.stopVideo();

              var q = quizzes[time];
              q.style.display = "block";
              $("textarea", q).focus();
              quizzes[time] = null; // so it will not appear again
            }
          }, 500);
        } else {
          if(interval)
            clearInterval(interval);
          interval = null;
          }
      };
    }

    $(".annotated-video").each(function(idx, holder) {
      // 640x390 is the default ratio, so we want to keep to that while making it fit
      // in the actual box we have. So we'll look at the current width and change the
      // height to have that ratio before inserting the video.
      var w = holder.offsetWidth;
      var h = w / 640 * 390;
      holder.style.height = h + "px";

      // we'll automatically add a player-holder to hold the youtube iframe itself
      var playerHolder = document.createElement("div");
      playerHolder.className = "player-holder";
      holder.insertBefore(playerHolder, holder.firstChild);

      var player = new YT.Player(playerHolder, {
        height: holder.height,
        width: holder.width,
        videoId: holder.getAttribute("data-youtube-id"),
        playerVars: {
          'start': readTime(holder.getAttribute("data-start-time")),
          'playsinline': 1, // keeps it inline even on iOS so we can draw over it
          'modestbranding': 1, // disables the "watch on youtube" button
          'fs':0 // disables the full screen button, so we can still pop up over it
        }
      });

      player.addEventListener("onStateChange", onPlayerStateChange(player, holder));

      // This handles the close button inside the quizzes.
      // The quiz html must include the button, but should not include
      // the javascript to resume playing because we do it here.
      $(holder).click(function(event) {
        if(event.target.tagName == "BUTTON") {
          var e = event.target;
          e = e.parentNode;
          e.style.display = 'none';
          player.playVideo();
        }
       });
    });
  }

  // make our handler available for the youtube script to find
  // this name must not change
  window.onYouTubeIframeAPIReady = onYouTubeIframeAPIReady;

  // and asynchronously load the youtube API code
  addYouTubeScript();
}

/*
<!-- data-youtube-id is the youtube video ID (in v= in the url). It is required. -->
<!-- data-start-time is the time of the video that we'll start. So if it is 1:30,
     hitting play in the video will start it at one minute, thirty seconds in to the video -->
<div class="annotated-video" data-youtube-id="Obiztwn2oEU" data-start-time="12:55">
  <!-- Inside the div, we can add our quizzes. They must be dives with the quiz class -->
  <!-- the data-time-to-display attribute is required. It tells when this quiz shows. When
       the video reaches this point, it will pause and display this div over the video. -->
  <div class="quiz" data-time-to-display="13:00">
    <p>Challenge or outcome?</p>
    <textarea style="width: 100%;"></textarea>

    <!-- Each quiz should have some kind of close button. If you have a form inside,
         be sure to submit it via AJAX unless you are done with the video because otherwise
	 the page refresh will reset the whole video. -->
    <button type="button" class="close">Back to the video</button>
  </div>

  <!-- You may have as many quizzes as you want, each with independent content. -->
  <div class="quiz" data-time-to-display="13:05">
    <p>Quiz 2 can be different</p>
    <textarea style="width: 100%;"></textarea>
    <select><option>Choice 1</option><option>Choice 2</option></select>

    <button type="button" class="close">Back to the video</button>
  </div>

</div>

*/

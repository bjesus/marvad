/* Author: Yo'av Moshe
*/

$(document).ready(function() {   

  var socket = io.connect();

  $('#sender').bind('click', function() {
   socket.emit('message', 'Message Sent on ' + new Date());     
  });

  socket.on('server_message', function(data){
   $('#rides-list').prepend('<li class="ui-li ui-li-static ui-body-d"><h3 class="ui-li-heading">' +
   							data.content +
   							'</h3><p class="ui-li-desc">' +
   							'לפני שעתיים | ' + data.name + ' | ' + data.phone + ' | ' +
							'<a data-rel="dialog" href="/remove/' + data.id + '" class="ui-link">מחיקה</a></p></li>').show('slow');  
  });
});
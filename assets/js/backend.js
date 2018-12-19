$(document).ready(function(){
    // disable send button first
    $(".write_msg").attr('placeholder', 'Please select a client first');
    $(".write_msg").attr('disabled', 'disabled');
    $(".msg_send_btn").attr('disabled', 'disabled');

	var clickedSession = "";

	// Connect to socket.io
    var socket = io.connect('http://137.189.47.43:4000');

    // Check for connection
    if(socket !== undefined){

    	socket.emit('handle_adminConnect');

        /*
            Socket IO events
        */

    	// Handle new client online
        socket.on('handle_backend_sessionList', function(data){
            //alert(data);
            $( ".inbox_chat").empty();
            
            // recevie current sessions from server
            if(data != undefined && data.length  ){
                for(var x = 0; x < data.length; x++){

                    // build the list on left hand side
                        var chat_list = document.createElement('div');
                        chat_list.setAttribute('class', 'chat_list');
                        chat_list.setAttribute('id', 'sessionItem');
                        chat_list.setAttribute('session', data[x]);

                        var chat_people = document.createElement('div');
                        chat_people.setAttribute('class', 'chat_people');
                        chat_people.setAttribute('session', data[x]);

                        var chat_ib = document.createElement('div');
                        chat_ib.setAttribute('class', 'chat_ib');
                        chat_ib.setAttribute('session', data[x]);

                        var session = document.createElement('h5');
                        session.setAttribute('session', data[x]);

                        var ahref = document.createElement('a');
                        ahref.setAttribute('tabindex', 0);
                        ahref.setAttribute('class', "no-delcaration");
                        ahref.setAttribute('role', "button");
                        ahref.setAttribute('data-toggle', "popover");
                        ahref.setAttribute('data-trigger', "focus");
                        ahref.setAttribute('data-content', "Found!");
                        ahref.setAttribute('session', data[x]);
                        ahref.textContent = data[x];

                        session.appendChild(ahref);
                    // end of building the list

                    // add the element to list
                    chat_ib.appendChild(session);
                    chat_people.appendChild(chat_ib);
                    chat_list.appendChild(chat_people);

                    $( ".inbox_chat").prepend(chat_list);
                }
            }

            // active popovers
            $('[data-toggle="popover"]').popover();  


        });

        // Handle new messages from server
        socket.on('handle_retrive_backend_allMessages', function(data){

            if(data.length){
          
                var enableToRefresh = false;
                for(var x = 0;x < data.length;x++){
                    if (data[x].name == clickedSession) enableToRefresh = true;
                }

                if(enableToRefresh){
                    // clear
                    $(".msg_history").empty();

      
                    for(var x = 0;x < data.length;x++){
                        // Build out chat message list
                        var message = document.createElement("div");
                        
                        // determine the message whether is sent by staff
                        if (data[x].staff == "yes"){
                            message.setAttribute("class", "outgoing_msg");

                            var sent_msg = document.createElement("div");
                            sent_msg.setAttribute("class", "sent_msg");
                            
                            var pmsg = document.createElement("p");
                            pmsg.textContent = data[x].message;

                            var sentTime = document.createElement("span");
                            sentTime.setAttribute("class", "time_date");
                            sentTime.textContent = data[x].datetime;
                   
                            sent_msg.appendChild(pmsg);
                            sent_msg.appendChild(sentTime);
                            message.appendChild(sent_msg);

                            $(".msg_history").append(message);
                        }
                        else{
                            message.setAttribute("class", "incoming_msg");

                            var incoming_msg_img = document.createElement("div");
                            incoming_msg_img.setAttribute("class", "incoming_msg_img");

                            var imgElement = document.createElement("img");
                            imgElement.setAttribute("src", "http://137.189.47.43/assets/img/client-pic.png");

                            var received_msg = document.createElement("div");
                            received_msg.setAttribute("class", "received_msg");
                            
                            var received_withd_msg = document.createElement("div");
                            received_withd_msg.setAttribute("class", "received_withd_msg");

                            var sentTime = document.createElement("span");
                            sentTime.setAttribute("class", "time_date");
                            sentTime.textContent = data[x].datetime;

                            var pmsg = document.createElement("p");
                            pmsg.textContent = data[x].message;

                            received_withd_msg.appendChild(pmsg);
                            received_withd_msg.appendChild(sentTime);
                            incoming_msg_img.appendChild(imgElement);
                            received_msg.appendChild(received_withd_msg);
                            
                            message.appendChild(incoming_msg_img);
                            message.appendChild(received_msg);
                            

                            $(".msg_history").append(message);

                        }
                    }
                }
                $(".msg_history").animate({ scrollTop: 8000 }, "fast");
            }
        });

        // Handle result from search function
        socket.on('handle_backend_search_result', function(data){
            var uniqueSession = [];

            // remove duplicats
            if(data.length){
                for(var i = 0;i < data.length; i++){
                    if (uniqueSession.indexOf(data[i].name) < 0){
                        uniqueSession.push(data[i].name);
                    }
                }
            }

            $( "#search-result" ).empty();
            for(var i = 0;i < uniqueSession.length; i++){
                $( "#search-result" ).append(uniqueSession[i]);

                $('[data-toggle="popover"][session="' + uniqueSession[i] + '"]').popover('show');  
            }
        });


        /*
            Element click events
        */

        // Listener for clicks on client list
        $( ".inbox_chat").click(function(event){
            $(".chat_list").removeClass("active_chat");

            clickedSession = event.target.getAttribute("session");
            $("div[class='chat_list'][session='" + clickedSession + "']").addClass("active_chat");

            socket.emit("handle_retrive_backend_allMessages_bySession", clickedSession);

            // active send button
            if (clickedSession != ""){
                $(".write_msg").attr('placeholder', 'Type a messsage');
                $(".write_msg").removeAttr('disabled');
                $(".msg_send_btn").removeAttr('disabled');
            }
            

        });

        // Listener for search button
        $( ".search-bar").keydown(function(event){
            if(event.which === 13 && event.shiftKey == false){  

                socket.emit("search", $( ".search-bar").val());
                $('[data-toggle="popover"]').popover('hide');  
                
            }
        });

        // Listener for search button
        $( "#search-btn").click(function(event){

            socket.emit("search", $( ".search-bar").val());
            $('[data-toggle="popover"]').popover('hide');  
         
        });

        // Listener for send message button
        $( ".msg_send_btn").click(function(){
            sendMessageToServer();
        });

        // Listener for send message button 
        $( ".write_msg").keydown(function(event){
            if(event.which === 13 && event.shiftKey == false){
                sendMessageToServer();
            }
        });

        // animated effect when new message arrives
        socket.on('handle_backend_highlight', function(data){
            $( "h5[session='" + data + "']" ).effect( "shake" );
        });

        

        /*
            Common functions
        */

        function sendMessageToServer(){
            // Emit to server input
            socket.emit('handle_backend_newMessage', {
                name: clickedSession,
                message: $( ".write_msg" ).val(),
                staff: "yes",
                datetime: new Date().toLocaleString()
            });
            $( ".write_msg" ).val("");
        }
        

    } // end of socket io

});
$(document).ready(function(){

	// Connect to socket.io
    var socket = io.connect('http://137.189.47.43:4000');

    // Check for connection
    if(socket !== undefined){
    	
        // Handle received messages
        socket.on('handle_retrive_frontend_allMessages', function(data){

            if(data.length){
                // clear the messages
                for(var x = 0;x < data.length;x++){
                    if (data[x].name == $( "#session_id" ).val()){
                        
                        // clear
                        $(".msg_history").empty();
                        break;
                    }
                }
                // append whole message chain
                for(var x = 0;x < data.length;x++){
                    // Build out chat message list
                    if(data[x].name == $( "#session_id" ).val()){
                        var message = document.createElement("div");
                        
                        // determine the message whether is sent by staff
                        if (data[x].staff == "no"){
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
                            imgElement.setAttribute("src", "http://137.189.47.43/assets/img/technician-pic.png");

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



        // Handle Send Button
        $( ".msg_send_btn").click(function(){
            sendMessageToServer();
        });

        // Handle Send Button
        $( ".write_msg").keydown(function(event){
            if(event.which === 13 && event.shiftKey == false){
                sendMessageToServer();
            }
        });

        /*
            Common functions
        */

        function sendMessageToServer(){
            // Emit to server input
            socket.emit('handle_frontend_newMessage', {
                name: $( "#session_id" ).val(),
                message: $( ".write_msg" ).val(),
                staff: "no",
                datetime: new Date().toLocaleString()
            });
            $( ".write_msg" ).val("");
        }
    } // end of socket io

});
ClientList = {
    clients: [],

    update: function(master) {
        this.clients = [];

        if (master.clients.length) {
            for(i = 0; i < master.clients.length; i++) {
                if (master.clients[i].parsedUserAgent) {
                    this.clients.push(master.clients[i].host+' '+master.clients[i].parsedUserAgent);
                }
            }
        }

        this.refresh();
    },

    refresh: function() {
        if (this.clients.length) {
            $('ul.clients').html('<ul><li>'+this.clients.join('</li><li>')+'</li></ul>');
        }
        else {
            $('ul.clients').html('No clients connected.');
        }
    }

}

MasterList = {
    masters: [],

    setMasters: function(masters) {
        var self = this;

        self.masters = masters;

        $.each(self.masters, function(index, item) {
            self.masters[index].refresh = true;
        });

        self.refreshMasterList();
    },

    updateMaster: function(master) {
        var self = this,
            newMaster = true;

        master.refresh = true;

        $.each(self.masters, function(index, item) {
            if (item.clientPort == master.clientPort) {
                self.masters[index] = master;
                newMaster = false;
            }
        });

        if (newMaster) {
            self.masters.push(master);
        }

        self.refreshMasterList();
    },

    refreshMasterList: function() {
        var self = this;

        $.each(self.masters, function(index, item) {
            if (item.refresh) {
                self.refreshMaster(item);
                self.masters[index].refresh = false;
            }
        });
    },

    refreshMaster: function(master) {
        var self = this,
            li = $('#master'+master.clientPort),
            liContent,
            i;


        liContent = '<i>'+master.name+'</i>, client port: <i>'+master.clientPort+', </i>';
        if (master.host) {
            liContent += '<span class="connected">connected on host '+master.host+'</span>';
        }
        else {
            liContent += '<span class="not-connected">not connected</span>';
        }
        if (master.passwordRequired) {
            liContent += '&nbsp;<label for="MasterPassword">Password: </label><input type="text" id="MasterPassword" name="MasterPassword" />';
        }
        liContent += '<button onclick="window.location.href = \'/client/'+master.clientPort;
        if (master.passwordRequired) {
            liContent += '/\'+$(\'#MasterPassword\').val()';
        }
        else {
            liContent += '\'';
        }
        liContent += '">Connect as client</button>';

        liContent += '<br />';
        liContent += 'Clients: <ul>';
        for(i = 0; i < master.clients.length; i++) {
            liContent += '<li>'+master.clients[i].host+' '+master.clients[i].parsedUserAgent+'</li>'
        }
        liContent += '</ul>'

        if (li.length) {
            li.html(liContent);
        }
        else {
            $('ul.masters').append('<li id="master'+master.clientPort+'">'+liContent+'</li>');
        }
    }

}

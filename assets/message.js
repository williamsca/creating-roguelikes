Game.message = {
  attr: {
    freshMessages: [], // reverse queue
    staleMessages: [], // queue
    archivedMessages: [], // queue
    archiveMessageLimit: 200
  },
  renderOn: function(display) {
    display.clear();
    var dispRowMax = display._options.height - 1;
    var dispColMax = display._options.width - 2;
    var dispRow = 0;
    var freshMsgIdx = 0;
    var staleMsgIdx = 0;
    // fresh messages in white
    for (freshMsgIdx = 0; freshMsgIdx < this.attr.freshMessages.length && dispRow < dispRowMax; freshMsgIdx++) {
      dispRow += display.drawText(1, dispRow, '%c{#fff}%b{#000}' + this.attr.freshMessages[freshMsgIdx] + '%c{}%b{}', 79);
    }
    // stale messages in grey
    for (staleMsgIdx = 0; staleMsgIdx < this.attr.staleMessages.length && dispRow < dispRowMax; staleMsgIdx++) {
      dispRow += display.drawText(1,dispRow,'%c{#aaa}%b{#000}'+this.attr.staleMessages[staleMsgIdx]+'%c{}%b{}',79);
    }
  },

  ageMessages: function( lastStaleMessageIdx) {
    // archive oldest stale message
    /*
    if (this.attr.staleMessages.length > 0) {
      this.attr.archivedMessages.unshift(this.attr.staleMessages.pop());
    }*/
    // archive all stale messages (a possible alteration to help with clarity)
    while (this.attr.staleMessages.length > 0) {
      this.attr.archivedMessages.unshift(this.attr.staleMessages.pop());
    }

    // archive any additional stale messages that didn't get shown
    while (this.attr.staleMessages.length > lastStaleMessageIdx) {
      this.attr.archivedMessages.unshift(this.attr.staleMessages.pop());
    }

    // dump messages too old for archive
    while (this.attr.staleMessages.length > this.attr.archiveMessageLimit) {
      this.attr.archivedMessages.pop();
    }

    // move fresh messages to stale
    while (this.attr.freshMessages.length > 0) {
      this.attr.staleMessages.unshift(this.attr.freshMessages.pop());
    }
    
    Game.renderMessage();
  },
  sendMessage: function(msg) {
    this.attr.freshMessages.push(msg);
    Game.renderMessage();
  },
  clearMessages: function() {
    this.attr.freshMessages = [];
    this.attr.staleMessages = [];
  },
  getArchives: function () {
    return this.attr.archivedMessages;
  },
  getArchiveMessageLimit: function() {
    return this.attr.archiveMessageLimit;
  },
  setArchiveMessageLimit: function (n) {
    this.attr.archiveMessageLimit = n;
  }
};

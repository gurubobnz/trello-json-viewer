function Trello(data) {
    var self = this;
    self.board = new Board(data);
}

function Prefs(data) {
    var self = this;
    self.backgroundImage = data.backgroundImage;
    self.backgroundBottomColor = data.backgroundBottomColor;
    self.backgroundTopColor = data.backgroundTopColor;
}

function Board(data) {
    var self = this;

    self.id = data.id;
    self.desc = data.desc;
    self.name = data.name;
    self.lists = ko.observableArray();
    self.cards = ko.observableArray();
    self.actions = ko.observableArray();
    self.members = ko.observableArray();

    self.currentlyOpenCard = ko.observable();    // a card which is open, if any
    self.openCard = card => self.currentlyOpenCard(card);
    self.closeCard = () => self.currentlyOpenCard(null);

    self.prefs = new Prefs(data.prefs);
    
    self.getListById = id => self.lists().filter(list => list.id == id)[0];
    self.getCardById = id => self.cards().filter(card => card.id == id)[0];
    self.getActionById = id => self.actions().filter(action => action.id == id)[0];
    self.getMemberById = id => self.members().filter(member => member.id == id)[0];

    self.assignCardToList = (listId, cardId) => {
        var list = self.getListById(listId);
        var card = self.getCardById(cardId);
        if(list && card) list.addCard(card);
    }

    self.assignActionToCard = (actionId, cardId) => {
        var card = self.getCardById(cardId);
        var action = self.getActionById(actionId);
        if(card && action) card.addAction(action)
    }

    // Add lists to board
    self.lists(data.lists.filter(list => !list.closed).map(data => new List(data)))

    // Add cards to board
    self.cards(data.cards.filter(card => !card.closed).map(data => new Card(data)))

    // Add actions to board
    self.actions(data.actions.map(data => new Action(data)))

    // Add members to board
    self.members(data.members.map(data => new Member(data)))

    // Assign actions to cards
    self.actions().filter(action => action.data.card).forEach(action => self.assignActionToCard(action.id, action.data.card.id))

    // Assign cards to lists
    self.cards().forEach(card => self.assignCardToList(card.idList, card.id))

    // Assign members to actions
    self.actions().forEach(action => action.setMember(self.getMemberById(action.idMemberCreator)))

    return self;
}

function Action(data) {
    var self = this;
    self.id = data.id;
    self.member;
    self.idMemberCreator = data.idMemberCreator;
    self.data = data.data;
    self.type = data.type;
    self.date = data.date;

    self.setMember = member => self.member = member;
}

function Card(data) {
    var self = this;
    self.id = data.id;
    self.idList = data.idList;
    self.name = data.name;
    self.cover = new CardCover(data.cover);
    self.actions = ko.observableArray();
    self.addAction = action => self.actions.push(action)

    // self.data = data;
}

function Member(data) {
    var self = this;
    self.id = data.id;
    self.avatarUrl = ko.pureComputed(() => data.avatarUrl ? data.avatarUrl+'/30.png' : null)
    self.fullName = data.fullName;
    self.initials = data.initials;
}

function CardCover(data) {
    var self = this;
    self.idAttachment = data.idAttachment;
}

function List(data) {
    var self = this;
    self.id = data.id;
    self.closed = data.closed;
    self.name = data.name;
    self.cards = ko.observableArray();
    self.addCard = card => {
        self.cards.push(card);
    }
}

ko.bindingHandlers.trelloBoard = {
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        var board = valueAccessor();
        $(element).css({
            'background-color': board.prefs.backgroundBottomColor,
            'background-size': 'cover',
            'background-position': 'center',
            'background-image': 'url('+board.prefs.backgroundImage+')'
        })
    },
    update: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        
    }
}

ko.bindingHandlers.trelloCardCover = {
    init: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        var card = valueAccessor();

        var coverAttachment = card.actions().filter(action => action.data.attachment && action.data.attachment.id == card.cover.idAttachment)
        if(coverAttachment.length == 1) {
            var backgroundImage = coverAttachment[0].data.attachment.url
            if(backgroundImage) {
                $(element).css({
                    // 'background-color': 'rgb(29, 83, 43)',
                    'background-image': 'url("'+backgroundImage+'")',
                    'height': '192px',
                    'background-size': 'contain',
                    'background-position': 'center',
                    'background-repeat': 'no-repeat',
                })
            }
        }
    },
    update: (element, valueAccessor, allBindings, viewModel, bindingContext) => {
        
    }
}



var vm;
window.onload = () => $.get('trello.json', response => {
    vm = new Trello(response);
    ko.applyBindings(vm);
});
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
    self.members = ko.observableArray();        // all members who are on the board and mentioned in actions
    self.boardMembers = ko.observableArray();   // members who are actually members of the board
    self.checklists = ko.observableArray();

    self.setDocumentTitle = value => document.title = value+' | #offlinetrello'

    self.currentlyOpenCard = ko.observable();    // a card which is open, if any
    self.openCard = card => {
        document.location.replace('#card:'+card.shortLink)
        self.setDocumentTitle(card.name);
        self.currentlyOpenCard(card);
    }
    self.closeCard = () => {
        document.location.replace('#')
        self.setDocumentTitle(self.name);
        self.currentlyOpenCard(null);
    }

    self.prefs = new Prefs(data.prefs);
    
    self.getListById = id => self.lists().filter(list => list.id == id)[0];
    self.getCardById = id => self.cards().filter(card => card.id == id)[0];
    self.getCardByShortLink = shortLink => self.cards().filter(card => card.shortLink == shortLink)[0];
    self.getActionById = id => self.actions().filter(action => action.id == id)[0];
    self.getMemberById = id => self.members().filter(member => member.id == id)[0];
    self.getChecklistById = id => self.checklists().filter(checklist => checklist.id == id)[0];

    // It is possible for assigning to have nothing to be assigned to.
    // This is because we exclude closed lists and cards from the board
    self.assignCardToList = (list, card) => {
        if(list && card) list.addCard(card)
    }

    self.assignChecklistToCard = (checklist, card) => {
        if(checklist && card) card.addChecklist(checklist)
    }

    self.assignActionToCard = (action, card) => {
        var actionTypesToIgnore = [
            'updateCard',
            'moveCardFromBoard'
        ]
        if(actionTypesToIgnore.indexOf(action.type) == -1)
            if(card) card.addAction(action);
    }

    self.assignMemberToCard = (member, card) => {
        if(card) card.members.push(member)
    }

    // Load the root elements into the board
    self.lists(data.lists.filter(list => !list.closed).map(data => new List(data)))
    self.cards(data.cards.filter(card => !card.closed).map(data => new Card(data)))
    self.actions(data.actions.map(data => new Action(data)))

    // Members of the board
    self.boardMembers(data.members.map(data => new Member(data)))

    // Members of the board ... and also scan actions for members as the members as per the board are just the current members
    self.members(data.members.map(data => new Member(data)))
    var memberIds = self.members().map(member => member.id)
    self.actions().forEach(action => {
        if(action.memberCreator && memberIds.indexOf(action.memberCreator.id) == -1) {
            self.members.push(new Member(action.memberCreator))
            memberIds.push(action.memberCreator.id)
        }
    })

    self.checklists(data.checklists.map(data => new Checklist(data)))
    self.actions().filter(action => action.data.card).forEach(action => self.assignActionToCard(action, self.getCardById(action.data.card.id)))

    // Assign items to containers (e.g. cards to lists, members to cards etc.)
    self.cards().forEach(card => self.assignCardToList(self.getListById(card.idList), card))
    self.actions().forEach(action => action.setMember(self.getMemberById(action.idMemberCreator)))
    self.cards().forEach(card => card.idMembers.forEach(idMember => self.assignMemberToCard(self.getMemberById(idMember), card)))
    self.checklists().forEach(checklist => self.assignChecklistToCard(checklist, self.getCardById(checklist.idCard)))

    // Count items for card cover decorations
    self.cards().forEach(card => {
        card.commentCount = card.actions().filter(action => action.type == "commentCard").length;
        card.checklists().forEach(chklist => {
            card.taskCountAll = chklist.items.length;
            card.taskCountComplete = chklist.items.filter(item => item.state == "complete").length;;
            });
        card.attachCount = card.actions().filter(action => action.data.attachment).length;
        });

    self.setDocumentTitle(self.name)

    return self;
}

function Action(data) {
    var self = this;
    self.id = data.id;
    self.member;
    self.idMemberCreator = data.idMemberCreator;
    self.memberCreator = data.memberCreator;
    self.data = data.data;
    self.type = data.type;
    self.date = data.date;

    self.actionTemplate = ko.pureComputed(() => 'action'+self.type.replace(/^./, self.type[0].toUpperCase()))
    self.prettyDate = ko.pureComputed(() => self.date)
    self.setMember = member => {
        self.member = member;
    }

    self.prettyCardComment = ko.pureComputed(() => {
        // TODO: markdown conversion
        return self.data.text
    })
}

function Card(data) {
    var self = this;
    self.id = data.id;
    self.url = data.url;
    self.shortLink = data.shortLink;
    self.idList = data.idList;
    self.idMembers = data.idMembers;
    self.name = data.name;
    self.cover = new CardCover(data.cover);
    self.members = ko.observableArray();
    self.actions = ko.observableArray();
    self.checklists = ko.observableArray();
    self.addAction = action => self.actions.push(action)
    self.addChecklist = checklist => self.checklists.push(checklist)
    self.labels = data.labels;
    self.commentCount = 0;
    self.taskCountAll = 0;
    self.taskCountComplete = 0;
    self.attachCount = 0;

    // self.data = data;
}

function Member(data) {
    var self = this;
    self.id = data.id;
    self.avatarUrl = ko.pureComputed(() => data.avatarUrl ? data.avatarUrl+'/30.png' : null)
    self.fullName = data.fullName;
    self.username = data.username;
    self.initials = data.initials;

    self.description = ko.pureComputed(() => self.fullName+' ('+self.username+')')
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

function Checklist(data) {
    var self = this;
    self.id = data.id;
    self.idCard = data.idCard;
    self.name = data.name;
    self.items = data.checkItems.map(item => new ChecklistItem(item))
    self.visibleItems = ko.pureComputed(() => self.items.filter(i => self.hideCompleted() ? i.checked() != self.hideCompleted() : true))
    self.pos = data.pos;
    self.percentComplete = ko.pureComputed(() => self.items.length ? (self.items.filter(i => i.checked()).length / self.items.length) * 100 : 0)
    self.prettyPercentComplete = ko.pureComputed(() => Math.ceil(self.percentComplete())+'%')

    self.hideCompleted = ko.observable(false);
    self.toggleHideCompleted = () => self.hideCompleted(!self.hideCompleted())
}

function ChecklistItem(data) {
    var self = this;
    self.state = data.state;
    self.name = data.name;
    self.pos = data.pos;
    self.checked = ko.pureComputed(() => self.state == 'complete')
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
            var backgroundImage = coverAttachment[0].data.attachment.previewUrl
            if(backgroundImage) {
                var height = backgroundImage.match(/\/[0-9]+?x([0-9]+)\//)[1]
                height /= 2
                $(element).css({
                    // 'background-color': 'rgb(29, 83, 43)',
                    'background-image': 'url("'+backgroundImage+'")',
                    'height': height+'px',
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


var filename = 'trello.json';
var vm;
window.onload = () => $.get(filename, response => {
    vm = new Trello(response);
    ko.applyBindings(vm);

    // Open card if one in URL:
    var matches = document.location.hash.match(/card:([0-9A-Za-z]+)/);
    if(matches) {
        card = vm.board.getCardByShortLink(matches[1])
        vm.board.openCard(card)
    }
    console.log(matches);
});
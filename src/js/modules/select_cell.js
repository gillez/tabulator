// YoYottaID Web Client
//
// Author: Giles Ellis
// Created: 4th Jan 2019
// Copyright © 2019 YoYotta. All rights reserved.
//

///////////////////////////////////////////////////////////////////////////////////////////////
// Tabulator module to allow Cell selection,
// Unlike selectRow, there are no key/mouse event handlers.  All selection should be done
// through cell.select() or Tabulator.prototype.selectCell() calls (and the corresponding deselect)
// Also (as selecting is only done from code), there is no "isSelectable" option or check.
///////////////////////////////////////////////////////////////////////////////////////////////

var SelectCell = function(table){
	this.table = table; //hold Tabulator object
	this.selectedCells = []; //hold selected cells
};

SelectCell.prototype.clearSelectionData = function(silent){
	this.selectedCells = [];

	if(!silent){
		this._cellSelectionChanged();
	}
};

SelectCell.prototype.initializeCell = function(cell){
	cell.modules.select = {selected:false};
};

//toggle cell selection
SelectCell.prototype.toggleCell = function(cell){
	if(cell.modules.select.selected){
		this._deselectCell(cell);
	}else{
		this._selectCell(cell);
	}
};

// select a number of cells
// Unlike rows you cannot select all cells with this function.  Use selectRows if selecting all data is required.
// Select all cells may be added later.
SelectCell.prototype.selectCells = function(cells){
	var self = this;

	switch(typeof cells){
		case "undefined":
		console.error("Tabulator selectCells: must be passed a cell selector");
		break;

		case "boolean":
		console.error("Tabulator selectCells: boolean argument not handled, must be passed a cell selector");
		break;

		default:
		if(Array.isArray(cells)){
			cells.forEach(function(cell){
				self._selectCell(cell, true, true);
			});

			self._cellSelectionChanged();
		}else{
			self._selectCell(cells, false, true);
		}
		break;
	}
};

//select an individual cell
// Note: as there is no cell_manager, cells can only be selected by passing Cell or CellComponent objects.
// Unlike rows, they can't be selected from an ID or DOM element.
// Also, not handle max cell count and rolling selection
SelectCell.prototype._selectCell = function(cellInfo, silent, force){
	var cell = this.getCell(cellInfo);

	if(cell){
		if(this.selectedCells.indexOf(cell) == -1){
			cell.modules.select.selected = true;
			cell.getElement().classList.add("tabulator-selected");

			this.selectedCells.push(cell);

			if(!silent){
				this.table.options.cellSelected.call(this.table, cell.getComponent());
				this._cellSelectionChanged();
			}
		}
	}else{
		if(!silent){
			console.warn("Selection Error - No such cell found, ignoring selection:" + cellInfo);
		}
	}
};

SelectCell.prototype.isCellSelected = function(cell){
	return this.selectedCells.indexOf(cell) !== -1;
};

//deselect a number of cells
SelectCell.prototype.deselectCells = function(cells){
	var self = this,
	cellCount;

	if(typeof cells == "undefined"){

		cellCount = self.selectedCells.length;

		for(let i = 0; i <cellCount; i++){
			self._deselectCell(self.selectedCells[0], true);
		}

		self._cellSelectionChanged();
	}else{
		if(Array.isArray(cells)){
			cells.forEach(function(cell){
				self._deselectCell(cell, true);
			});

			self._cellSelectionChanged();
		}else{
			self._deselectCell(cells);
		}
	}
};

//deselect an individual cell
SelectCell.prototype._deselectCell = function(cellInfo, silent){
	var self = this,
	cell = this.getCell(cellInfo),
	index;

	if(cell){
		index = self.selectedCells.findIndex(function(selectedCell){
			return selectedCell == cell;
		});

		if(index > -1){

			cell.modules.select.selected = false;
			cell.getElement().classList.remove("tabulator-selected");
			self.selectedCells.splice(index, 1);

			if(!silent){
				self.table.options.cellDeselected.call(this.table, cell.getComponent());
				self._cellSelectionChanged();
			}
		}
	}else{
		if(!silent){
			console.warn("Deselection Error - No such cell found, ignoring selection:" + cellInfo);
		}
	}
};

SelectCell.prototype.getCell = function(subject) {
	if(typeof subject == "object"){
		if(subject instanceof Cell){
			//subject is cell element
			return subject;
		}else if(subject instanceof CellComponent){
			//subject is public cell component
			return subject._getSelf() || false;
		}
	}
	return false;
};


SelectCell.prototype.getSelectedCells = function(){
	var cells = [];

	this.selectedCells.forEach(function(cell){
		cells.push(cell.getComponent());
	});

	return cells;
};

SelectCell.prototype._cellSelectionChanged = function(){
	this.table.options.cellSelectionChanged.call(this.table, this.getSelectedCells());
};

Tabulator.prototype.registerModule("selectCell", SelectCell);

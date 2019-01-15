// YoYottaID Web Client
//
// Author: Giles Ellis
// Created: 4th Jan 2019
// Copyright © 2019 YoYotta. All rights reserved.
//

///////////////////////////////////////////////////////////////////////////////////////////////
// Tabulator module to allow Column selection.
// This can be used with Row Selection to allow single or multiple cells to be selected, with
// the restriction that different rows can't have different columns selected.  If a column is
// selected, then cells from all selected rows will be selected.
// Unlike selectRow, there are no key/mouse event handlers for selectColumns.  All selection
// should be done through column.select() or Tabulator.prototype.selectColumn() calls (and the
// corresponding deselect).
// It may be better to control these events externally from selectRow and selectColumn, and call
// both as appropriate from a separate module.  For my purposes though, I am controlling all
// selection externally and calling the appropriate select functions and therefore haven't
// changed how selectRow works.
// Also (as selecting is only done from code), there is no "isSelectable" option or check.
// This could be added later, mostly for CSS hover styles.
///////////////////////////////////////////////////////////////////////////////////////////////

var SelectColumn = function(table){
	this.table = table; //hold Tabulator object
	this.selectedColumns = []; //hold selected columns.
};

SelectColumn.prototype.clearSelectionData = function(silent){
	this.selectedColumns = [];

	if(!silent){
		this._columnSelectionChanged();
	}
};

SelectColumn.prototype.initializeColumn = function(col){
	col.modules.select = {selected:false};
};

//toggle column selection
SelectColumn.prototype.toggleColumn = function(col){
	if(col.modules.select.selected){
		this._deselectColumn(col);
	}else{
		this._selectColumn(col);
	}
};

// select a number of columns
SelectColumn.prototype.selectColumns = function(cols){
	var self = this;

	switch(typeof cols){
		case "undefined":
		self.table.columnManager.columns.forEach(function(col){
			self._selectColumn(col, true, true);
		});

		self._columnSelectionChanged();
		break;

		case "boolean":
		if(cols === true){
			// Unlike rows, there is no concept of active columns.  Therefore an arg of true is the same as
			// no argument, i.e. select all columns.
			self.table.columnManager.columns.forEach(function(col){
				self._selectColumn(col, true);
			});

			self._columnSelectionChanged();
		}
		break;

		default:
		if(Array.isArray(cols)){
			cols.forEach(function(col){
				self._selectColumn(col, true);
			});

			self._columnSelectionChanged();
		}else{
			self._selectColumn(cols, false);
		}
		break;
	}
};

//select an individual column
SelectColumn.prototype._selectColumn = function(colInfo, silent){
	var col = this.table.columnManager.findColumn(colInfo),
	cells;

	if(col){
		if(this.selectedColumns.indexOf(col) == -1){
			col.modules.select.selected = true;

			// This should add the class to every cell in this column .
			cells = col.getCells();
			cells.forEach(this.addSelectedClass);

			this.selectedColumns.push(col);

			if(!silent){
				this.table.options.columnSelected.call(this.table, col.getComponent());
				this._columnSelectionChanged();
			}
		}
	}else{
		if(!silent){
			console.warn("Selection Error - No such column found, ignoring selection:" + colInfo);
		}
	}
};

SelectColumn.prototype.isColumnSelected = function(col){
	return this.selectedColumns.indexOf(col) !== -1;
};

//deselect a number of columns
SelectColumn.prototype.deselectColumns = function(cols){
	var self = this,
	colCount;

	if(typeof cols == "undefined"){
		colCount = self.selectedColumns.length;

		for(let i = 0; i <colCount; i++){
			self._deselectColumn(self.selectedColumns[0], true);
		}

		self._columnSelectionChanged();
	}else{
		if(Array.isArray(cols)){
			cols.forEach(function(col){
				self._deselectColumn(col, true);
			});

			self._columnSelectionChanged();
		}else{
			self._deselectColumn(cols, false);
		}

	}
};

//deselect an individual column
SelectColumn.prototype._deselectColumn = function(colInfo, silent){
	var self = this,
	col = this.table.columnManager.findColumn(colInfo),
	cells,
	index;

	if(col){
		index = self.selectedColumns.indexOf(col);

		if(index > -1){
			col.modules.select.selected = false;
			// Remove the class from every cell in this column .
			cells = col.getCells();
			cells.forEach(self.removeSelectedClass);
			self.selectedColumns.splice(index, 1);

			if(!silent){
				self.table.options.columnDeselected.call(this.table, col.getComponent());
				self._columnSelectionChanged();
			}
		}
	}else{
		if(!silent){
			console.warn("Deselection Error - No such column found, ignoring selection:" + columnInfo);
		}
	}
};

SelectColumn.prototype.getSelectedColumns = function(){
	var cols = [];

	this.selectedColumns.forEach(function(col){
		cols.push(col.getComponent());
	});

	return cols;
};

SelectColumn.prototype.addSelectedClass = function(cell) {
	cell.getElement().classList.add("tabulator-col-selected");
};

SelectColumn.prototype.removeSelectedClass = function(cell) {
	cell.getElement().classList.remove("tabulator-col-selected");
};

SelectColumn.prototype._columnSelectionChanged = function(){
	this.table.options.columnSelectionChanged.call(this.table, this.getSelectedColumns());
};

Tabulator.prototype.registerModule("selectColumn", SelectColumn);

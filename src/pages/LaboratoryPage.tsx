import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import Canvas from "../components/lab/Canvas";
import Toolbar from "../components/lab/Toolbar";

const LaboratoryPage = () => {
    return (
        <DndProvider backend={HTML5Backend}>
            <div className="w-full h-screen flex bg-gray-900">
                <Toolbar />
                <Canvas />
            </div>
        </DndProvider>
    );
};

export default LaboratoryPage;

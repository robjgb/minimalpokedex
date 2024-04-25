import React, { useEffect, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';
import physicalIcon from '../../assets/move-physical.png';
import specialIcon from '../../assets/move-special.png';
import statusIcon from '../../assets/move-status.png';
import { ArrowsUpDownIcon, BarsArrowUpIcon, BarsArrowDownIcon } from '@heroicons/react/24/outline';

const MovesetLoader = () => {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y-2 text-sm border-separate border-spacing-2 bg-gray-100">
                <thead className="text-center">
                    <tr>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">#</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">Name</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">Type</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">Cat.</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">Power</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">Acc.</th>
                        <th className="whitespace-nowrap px-4 py-2 font-bold text-gray-900">PP</th>
                    </tr>
                </thead>
                <tbody className="">
                    {[...Array(3)].map((_, index) => (
                        <tr key={index} className=''>
                            <td className=" px-4 py-2 skeleton w-8 h-6 bg-gray-300"></td>
                            <td className=" px-4 py-2 skeleton w-32 h-6 bg-gray-300"></td>
                            <td className=" px-4 py-2 skeleton w-16 h-6 bg-gray-300"></td>
                            <td className=" px-4 py-2 skeleton w-16 h-6 bg-gray-300"></td>
                            <td className=" px-4 py-2 skeleton w-16 h-6 bg-gray-300"></td>
                            <td className=" px-4 py-2 skeleton w-16 h-6 bg-gray-300"></td>
                            <td className="whitespace-nowrap px-4 py-2 skeleton w-8 h-6 bg-gray-300"></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

const TableHeader = ({ column, sortConfig, onSort }) => {
    const { key, label } = column;
    const { key: sortKey, direction: sortDirection, status: sortStatus } = sortConfig;

    const isActive = sortKey === key;
    const iconClass = 'w-4 h-4 ml-1';

    let icon;
    if (isActive) {
        if (sortStatus === 'asc') {
            icon = <BarsArrowUpIcon className={`${iconClass} text-black`} />;
        } else if (sortStatus === 'desc') {
            icon = <BarsArrowDownIcon className={`${iconClass} text-black`} />;
        } else {
            icon = <ArrowsUpDownIcon className={`${iconClass} text-gray-400`} />;
        }
    } else {
        icon = <ArrowsUpDownIcon className={`${iconClass} text-gray-400`} />;
    }

    return (
        <th
            className="whitespace-nowrap px-4 py-2 font-bold text-gray-900 cursor-pointer"
            onClick={() => onSort(key)}
        >
            <div className="flex items-center justify-center">
                {label}
                {icon}
            </div>
        </th>
    );
};

export default function MovesetTable({ moves, versionGroups, selectedVersionGroup, onVersionGroupChange }) {
    const [moveData, setMoveData] = useState({});
    const [isLoading, setIsLoading] = useState(true);
    const [machineData, setMachineData] = useState({});
    const [filteredMoves, setFilteredMoves] = useState([]);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: '', status: 'default' });
    const [sortedMoves, setSortedMoves] = useState([]);

    const columns = [
        { key: '#', label: '#' },
        { key: 'name', label: 'Name' },
        { key: 'type', label: 'Type' },
        { key: 'cat.', label: 'Cat.' },
        { key: 'power', label: 'Power' },
        { key: 'acc.', label: 'Acc.' },
        { key: 'pp', label: 'PP' },
    ];

    const damageClassIcons = {
        physical: physicalIcon,
        special: specialIcon,
        status: statusIcon,
    };

    const getLearnMethodValue = (details, moveName) => {
        const { move_learn_method } = details;
        const methodName = move_learn_method.name;

        if (methodName === 'level-up') {
            return 0;
        } else if (methodName === 'machine') {
            const machineNumber = machineData[moveName]?.match(/\d+/)?.[0] || 0;
            return methodName === 'hm' ? 200 + parseInt(machineNumber, 10) : 100 + parseInt(machineNumber, 10);
        } else if (methodName === 'egg') {
            return 300;
        }
        return 400;
    };

    useEffect(() => {
        const sortMoves = () => {
            const sorted = [...filteredMoves].sort((a, b) => {
                switch (sortConfig.key) {
                    case '#':
                        const detailsA = a.version_group_details?.find(detail => detail.version_group.name === selectedVersionGroup);
                        const detailsB = b.version_group_details?.find(detail => detail.version_group.name === selectedVersionGroup);
                        const learnMethodA = detailsA && getLearnMethodValue(detailsA, a.move.name);
                        const learnMethodB = detailsB && getLearnMethodValue(detailsB, b.move.name);
                        if (!detailsA || !detailsB) {
                            return 0;
                        }
        
                        if (learnMethodA !== learnMethodB) {
                            return learnMethodA - learnMethodB;
                        }
                        return parseInt(detailsA.level_learned_at, 10) - parseInt(detailsB.level_learned_at, 10);
                    case 'name':
                        return a.move.name.localeCompare(b.move.name);
                    case 'type':
                        return moveData[a.move.name]?.type?.name.localeCompare(moveData[b.move.name]?.type?.name);
                    case 'cat.':
                        const categoryOrder = { physical: 0, special: 1, status: 2 };
                        return categoryOrder[moveData[a.move.name]?.damage_class?.name] - categoryOrder[moveData[b.move.name]?.damage_class?.name];
                    case 'power':
                        return (moveData[a.move.name]?.power || 0) - (moveData[b.move.name]?.power || 0);
                    case 'acc.':
                        return (moveData[a.move.name]?.accuracy || 0) - (moveData[b.move.name]?.accuracy || 0);
                    case 'pp':
                        return (moveData[a.move.name]?.pp || 0) - (moveData[b.move.name]?.pp || 0);
                    default:
                        return 0;
                }
            });
    
            if (sortConfig.status === 'default') {
                return filteredMoves;
            } else if (sortConfig.direction === 'desc') {
                return sorted.reverse();
            }
            return sorted;
        };
    
        setSortedMoves(sortMoves());
    }, [filteredMoves, sortConfig, selectedVersionGroup, moveData]);


    const handleSort = (key) => {
        let direction = 'asc';
        let status = 'asc';

        if (sortConfig.key === key) {
            if (sortConfig.status === 'default') {
                direction = 'asc';
                status = 'asc';
            } else if (sortConfig.status === 'asc') {
                direction = 'desc';
                status = 'desc';
            } else {
                direction = '';
                status = 'default';
            }
        }

        setSortConfig({ key, direction, status });
    };

    const fetchMoveData = async (moveUrl) => {
        const response = await fetch(moveUrl);
        return await response.json();
    };

    const fetchMachineData = async (machineUrl) => {
        const response = await fetch(machineUrl);
        const machineInfo = await response.json();
        return machineInfo.item.name;
    };

    useEffect(() => {
        const fetchData = async () => {
            setSortConfig({ key: null, direction: '', status: 'default' });
            setIsLoading(true);

            const filteredMovesData = moves.filter(move =>
                move.version_group_details.some(detail => detail.version_group.name === selectedVersionGroup)
            );

            const moveDataPromises = filteredMovesData.map(move => fetchMoveData(move.move.url));
            const moveDataArray = await Promise.all(moveDataPromises);

            const moveDataObject = moveDataArray.reduce((acc, data, index) => {
                acc[filteredMovesData[index].move.name] = data;
                return acc;
            }, {});

            const machineDataPromises = filteredMovesData.map(move => {
                const details = move.version_group_details.find(
                    detail => detail.version_group.name === selectedVersionGroup
                );
                const data = moveDataObject[move.move.name];

                if (details.move_learn_method.name === 'machine') {
                    const machine = data?.machines?.find(
                        machine => machine.version_group.name === selectedVersionGroup
                    );
                    if (machine) {
                        return fetchMachineData(machine.machine.url);
                    }
                }
                return Promise.resolve(null);
            });

            const machineDataArray = await Promise.all(machineDataPromises);

            const machineDataObject = machineDataArray.reduce((acc, data, index) => {
                if (data) {
                    acc[filteredMovesData[index].move.name] = data;
                }
                return acc;
            }, {});

            setFilteredMoves(filteredMovesData);
            setMoveData(moveDataObject);
            setMachineData(machineDataObject);
            setIsLoading(false);
        };

        fetchData();
    }, [moves, selectedVersionGroup]);


    const getLearnMethodDisplay = (details, moveName) => {
        const { move_learn_method } = details;
        const methodName = move_learn_method.name;

        if (methodName === 'level-up') {
            return `lv. ${details.level_learned_at}`;
        } else if (methodName === 'machine') {
            return machineData[moveName] || 'tm/hm';
        } else {
            return methodName;
        }
    };

    const availableVersionGroups = versionGroups.filter(group =>
        moves.some(move => move.version_group_details.some(detail => detail.version_group.name === group.name))
    );

    const defaultVersionGroup = availableVersionGroups.length > 0 ? availableVersionGroups[0].name : '';

    useEffect(() => {
        if (availableVersionGroups.length > 0 && !availableVersionGroups.some(group => group.name === selectedVersionGroup)) {
            onVersionGroupChange(defaultVersionGroup);
        }
    }, [availableVersionGroups, selectedVersionGroup, defaultVersionGroup, onVersionGroupChange]);


    if (moves.length === 0) {
        return (
            <div>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold text-gray-800">moveset</h2>
                    <select
                        className="px-4 py-2 rounded border border-gray-300"
                        value={selectedVersionGroup}
                        onChange={e => onVersionGroupChange(e.target.value)}
                        disabled
                    >
                        <option value="">No moves available</option>
                    </select>
                </div>
                <div className="text-center">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No Pokémon move data found</h3>
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-800">moveset</h2>
                <select
                    className="px-4 py-2 rounded border border-gray-300 bg-white"
                    value={selectedVersionGroup}
                    onChange={e => onVersionGroupChange(e.target.value)}
                    disabled={availableVersionGroups.length === 0}
                >
                    {availableVersionGroups.map(group => (
                        <option key={group.name} value={group.name}>
                            {group.name}
                        </option>
                    ))}
                </select>
            </div>
            {isLoading ? (
                <MovesetLoader />
            ) : filteredMoves.length === 0 ? (
                <div className="text-center">
                    <ExclamationCircleIcon className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No moves found for the selected version group</h3>
                    <p className="mt-1 text-sm text-gray-500">Try choosing another version group.</p>
                </div>
            ) : (
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                    <table className="min-w-full divide-y-2 divide-gray-200 bg-white text-sm">
                        <thead className="text-center bg-gray-100">
                            <tr>
                                {columns.map((column) => (
                                    <TableHeader
                                        key={column.key}
                                        column={column}
                                        sortConfig={sortConfig}
                                        onSort={handleSort}
                                    />
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 text-center">
                            {sortedMoves.map(move => {
                                const details = move.version_group_details.find(
                                    detail => detail.version_group.name === selectedVersionGroup
                                );
                                const data = moveData[move.move.name];
                                return (
                                    <tr key={move.move.name}>
                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                                            {details && getLearnMethodDisplay(details, move.move.name)}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{move.move.name}</td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.type?.name || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.damage_class?.name ? (
                                                <img
                                                    src={damageClassIcons[data.damage_class.name]}
                                                    alt={data.damage_class.name}
                                                    className="w-6 h-4 mx-auto"
                                                />
                                            ) : (
                                                '-'
                                            )}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.power || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.accuracy || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.pp || '-'}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};
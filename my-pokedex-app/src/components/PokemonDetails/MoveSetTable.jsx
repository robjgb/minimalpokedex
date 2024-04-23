import React, { useEffect, useState } from 'react';
import { ExclamationCircleIcon } from '@heroicons/react/24/outline';

const MovesetLoader = () => {
    return (
        <div className="overflow-x-auto rounded-lg border border-gray-200">
            <table className="min-w-full divide-y-2 bg-white text-sm border-separate border-spacing-2 ">
                <thead className="ltr:text-left rtl:text-right">
                    <tr>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">#</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Name</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Type</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Cat.</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Power</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Acc.</th>
                        <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">PP</th>
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


export default function MovesetTable({ moves, versionGroups, selectedVersionGroup, onVersionGroupChange }) {
    const [moveData, setMoveData] = useState({});
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchMoveData = async () => {
            setIsLoading(true);
            const data = {};
            for (const move of moves) {
                const response = await fetch(move.move.url);
                data[move.move.name] = await response.json();
            }
            setMoveData(data);
            setIsLoading(false);
        };

        fetchMoveData();
    }, [moves]);

    const availableVersionGroups = versionGroups.filter(group =>
        moves.some(move => move.version_group_details.some(detail => detail.version_group.name === group.name))
    );

    const defaultVersionGroup = availableVersionGroups.length > 0 ? availableVersionGroups[0].name : '';

    useEffect(() => {
        if (availableVersionGroups.length > 0 && !availableVersionGroups.some(group => group.name === selectedVersionGroup)) {
            onVersionGroupChange(defaultVersionGroup);
        }
    }, [availableVersionGroups, selectedVersionGroup, defaultVersionGroup, onVersionGroupChange]);

    const filteredMoves = moves.filter(move =>
        move.version_group_details.some(detail => detail.version_group.name === selectedVersionGroup)
    );

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
                    className="px-4 py-2 rounded border border-gray-300"
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
                        <thead className="ltr:text-left rtl:text-right">
                            <tr>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">#</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Name</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Type</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Cat.</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Power</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">Acc.</th>
                                <th className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">PP</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredMoves.map(move => {
                                const details = move.version_group_details.find(
                                    detail => detail.version_group.name === selectedVersionGroup
                                );
                                const data = moveData[move.move.name];

                                return (
                                    <tr key={move.move.name}>
                                        <td className="whitespace-nowrap px-4 py-2 font-medium text-gray-900">
                                            {details.level_learned_at}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">{move.move.name}</td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.type?.name || '-'}
                                        </td>
                                        <td className="whitespace-nowrap px-4 py-2 text-gray-700">
                                            {data?.damage_class?.name || '-'}
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
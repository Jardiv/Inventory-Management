export const SkeletonRow = ({ columns }) => (
	<tr className="table-row">
		{Array.from({ length: columns }).map((_, index) => (
            <td className="table-data" key={index}>
                <div className="skeleton-loading"></div>
            </td>
        ))}
	</tr>
);